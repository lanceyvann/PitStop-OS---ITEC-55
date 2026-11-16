import React, { useState } from 'react';
import { UserShopSettings, SettingsStorage, SavedOrderPreset } from '../../config/settingsStorage';
import { VehicleProfile, VehicleModel } from '../../models/vehicleProfile';
import { TireStockItem } from '../../models/tireStockItem';
import { X, Plus, Trash2, Edit2, RotateCcw, Save, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { VehicleIcon } from '../../skin/dictionary';

interface ShopSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserShopSettings;
  onSaveSettings: (newSettings: UserShopSettings) => void;
}

export const ShopSettingsDrawer: React.FC<ShopSettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'types' | 'models' | 'tires' | 'presets'>('types');
  const [localSettings, setLocalSettings] = useState<UserShopSettings>(settings);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const [editingType, setEditingType] = useState<Partial<VehicleProfile> | null>(null);
  const [editingModel, setEditingModel] = useState<Partial<VehicleModel> | null>(null);
  const [editingTire, setEditingTire] = useState<Partial<TireStockItem> | null>(null);
  const [editingPreset, setEditingPreset] = useState<Partial<SavedOrderPreset> | null>(null);

  if (!isOpen) return null;

  const showToast = (text: string, isError: boolean = false) => {
    setFeedbackMsg({ text, isError });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleSaveAll = () => {
    SettingsStorage.save(localSettings);
    onSaveSettings(localSettings);
    showToast('Settings saved to localStorage successfully!');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all vehicle types, models, tire catalog, and presets to initial defaults?')) {
      const defaults = SettingsStorage.resetToDefaults();
      setLocalSettings(defaults);
      onSaveSettings(defaults);
      showToast('Reset to factory defaults.');
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(localSettings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'tire_shop_kernel_config.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Configuration exported as JSON.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.vehicleProfiles && imported.tireCatalog) {
          setLocalSettings(imported);
          SettingsStorage.save(imported);
          onSaveSettings(imported);
          showToast('Configuration imported successfully!');
        } else {
          showToast('Invalid configuration file structure.', true);
        }
      } catch (err) {
        showToast('Failed to parse JSON file.', true);
      }
    };
    reader.readAsText(file);
  };

  const saveType = () => {
    if (!editingType) return;
    const validation = SettingsStorage.validateVehicleProfile(editingType);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid profile', true);
      return;
    }

    const typeId = editingType.id || `custom_${Date.now()}`;
    const fullType: VehicleProfile = {
      id: typeId,
      name: editingType.name!,
      tires: Number(editingType.tires) || 4,
      cpuRange: [Number(editingType.cpuRange?.[0]) || 4, Number(editingType.cpuRange?.[1]) || 8],
      ioRange: [Number(editingType.ioRange?.[0]) || 2, Number(editingType.ioRange?.[1]) || 4],
      defaultPriority: Number(editingType.defaultPriority) || 5,
      iconKey: (editingType.iconKey as any) || 'sedan',
      description: editingType.description || '',
    };

    const updated = localSettings.vehicleProfiles.some((p) => p.id === typeId)
      ? localSettings.vehicleProfiles.map((p) => (p.id === typeId ? fullType : p))
      : [...localSettings.vehicleProfiles, fullType];

    setLocalSettings({ ...localSettings, vehicleProfiles: updated });
    setEditingType(null);
    showToast('Vehicle type updated.');
  };

  const deleteType = (id: string) => {
    if (localSettings.vehicleProfiles.length <= 1) {
      showToast('Cannot delete the last remaining vehicle type.', true);
      return;
    }
    const updated = localSettings.vehicleProfiles.filter((p) => p.id !== id);
    setLocalSettings({ ...localSettings, vehicleProfiles: updated });
    showToast('Vehicle type deleted.');
  };

  const saveTire = () => {
    if (!editingTire) return;
    const validation = SettingsStorage.validateTireItem(editingTire);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid tire', true);
      return;
    }

    const tireId = editingTire.id || `tire_${Date.now()}`;
    const fullTire: TireStockItem = {
      id: tireId,
      brand: editingTire.brand!,
      model: editingTire.model!,
      size: editingTire.size!,
      price: Number(editingTire.price) || 0,
      stock: Number(editingTire.stock) || 0,
      reserved: editingTire.reserved || 0,
    };

    const updated = localSettings.tireCatalog.some((t) => t.id === tireId)
      ? localSettings.tireCatalog.map((t) => (t.id === tireId ? fullTire : t))
      : [...localSettings.tireCatalog, fullTire];

    setLocalSettings({ ...localSettings, tireCatalog: updated });
    setEditingTire(null);
    showToast('Tire catalog item saved.');
  };

  const deleteTire = (id: string) => {
    if (localSettings.tireCatalog.length <= 1) {
      showToast('Cannot delete the last remaining tire in catalog.', true);
      return;
    }
    const updated = localSettings.tireCatalog.filter((t) => t.id !== id);
    setLocalSettings({ ...localSettings, tireCatalog: updated });
    showToast('Tire item deleted.');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-[#FFFAF0] h-full shadow-2xl flex flex-col border-l border-[#E4D9C3] overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-[#F6EFE0] border-b border-[#E4D9C3] flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-[#1A1A1A]">Shop Settings & User Profiles</h2>
            <p className="text-xs text-[#1A1A1A]/70">
              Customize vehicle types, models, tire inventory catalog, and order presets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#1A1A1A]/20 hover:bg-white text-[#1A1A1A]"
            aria-label="Close settings drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Toast */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2 text-xs flex items-center gap-1.5 font-medium ${
              feedbackMsg.isError ? 'bg-[#B3261E]/10 text-[#B3261E]' : 'bg-[#059669]/10 text-[#059669]'
            }`}
          >
            {feedbackMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Tab Bar */}
        <div className="px-6 pt-3 bg-[#F6EFE0]/50 border-b border-[#E4D9C3] flex gap-2 text-xs">
          <button
            onClick={() => setActiveTab('types')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'types'
                ? 'border-[#CC5500] text-[#CC5500] font-bold'
                : 'border-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
            }`}
          >
            Vehicle Types ({localSettings.vehicleProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'models'
                ? 'border-[#CC5500] text-[#CC5500] font-bold'
                : 'border-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
            }`}
          >
            Vehicle Models ({localSettings.vehicleModels.length})
          </button>
          <button
            onClick={() => setActiveTab('tires')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'tires'
                ? 'border-[#CC5500] text-[#CC5500] font-bold'
                : 'border-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
            }`}
          >
            Tire Catalog ({localSettings.tireCatalog.length})
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-[#CC5500] text-[#CC5500] font-bold'
                : 'border-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
            }`}
          >
            Saved Presets ({localSettings.orderPresets.length})
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: VEHICLE TYPES */}
          {activeTab === 'types' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#1A1A1A]">Registered Vehicle Profiles</span>
                <button
                  onClick={() =>
                    setEditingType({
                      name: '',
                      tires: 4,
                      cpuRange: [4, 8],
                      ioRange: [2, 4],
                      defaultPriority: 5,
                      iconKey: 'sedan',
                      description: '',
                    })
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#CC5500] text-white rounded-lg font-medium hover:bg-[#A84500]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Vehicle Type</span>
                </button>
              </div>

              {/* Edit or Add Form */}
              {editingType && (
                <div className="p-4 bg-[#F6EFE0] border border-[#CC5500]/40 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-[#CC5500]">
                    {editingType.id ? 'Edit Vehicle Type' : 'Create New Vehicle Type'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Type Name</label>
                      <input
                        type="text"
                        value={editingType.name || ''}
                        onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                        placeholder="e.g. Electric Sedan"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Tire Count</label>
                      <input
                        type="number"
                        min="2"
                        max="16"
                        value={editingType.tires || 4}
                        onChange={(e) => setEditingType({ ...editingType, tires: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">
                        CPU Burst Range (Min - Max ticks)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="1"
                          value={editingType.cpuRange?.[0] || 2}
                          onChange={(e) =>
                            setEditingType({
                              ...editingType,
                              cpuRange: [Number(e.target.value), editingType.cpuRange?.[1] || 6],
                            })
                          }
                          className="w-16 bg-white border border-[#E4D9C3] rounded px-2 py-1"
                        />
                        <span>to</span>
                        <input
                          type="number"
                          min="1"
                          value={editingType.cpuRange?.[1] || 6}
                          onChange={(e) =>
                            setEditingType({
                              ...editingType,
                              cpuRange: [editingType.cpuRange?.[0] || 2, Number(e.target.value)],
                            })
                          }
                          className="w-16 bg-white border border-[#E4D9C3] rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">
                        I/O Burst Range (Min - Max ticks)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="0"
                          value={editingType.ioRange?.[0] || 1}
                          onChange={(e) =>
                            setEditingType({
                              ...editingType,
                              ioRange: [Number(e.target.value), editingType.ioRange?.[1] || 4],
                            })
                          }
                          className="w-16 bg-white border border-[#E4D9C3] rounded px-2 py-1"
                        />
                        <span>to</span>
                        <input
                          type="number"
                          min="0"
                          value={editingType.ioRange?.[1] || 4}
                          onChange={(e) =>
                            setEditingType({
                              ...editingType,
                              ioRange: [editingType.ioRange?.[0] || 1, Number(e.target.value)],
                            })
                          }
                          className="w-16 bg-white border border-[#E4D9C3] rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Default Priority (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editingType.defaultPriority || 5}
                        onChange={(e) => setEditingType({ ...editingType, defaultPriority: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Icon Style</label>
                      <select
                        value={editingType.iconKey || 'sedan'}
                        onChange={(e) => setEditingType({ ...editingType, iconKey: e.target.value as any })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                      >
                        <option value="motorcycle">Motorcycle</option>
                        <option value="sedan">Sedan</option>
                        <option value="suv">SUV / Pickup</option>
                        <option value="jeepney">Jeepney / Van</option>
                        <option value="truck">Truck / Bus</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingType(null)}
                      className="px-3 py-1.5 border border-[#1A1A1A]/30 rounded hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button onClick={saveType} className="px-3 py-1.5 bg-[#CC5500] text-white rounded font-medium">
                      Save Type
                    </button>
                  </div>
                </div>
              )}

              {/* Types List */}
              <div className="divide-y divide-[#E4D9C3] border border-[#E4D9C3] rounded-xl bg-white overflow-hidden">
                {localSettings.vehicleProfiles.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between hover:bg-[#F6EFE0]/40">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#F6EFE0]">
                        <VehicleIcon type={p.iconKey} className="w-5 h-5 text-[#CC5500]" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#1A1A1A]">{p.name}</div>
                        <div className="text-[11px] text-[#1A1A1A]/70">
                          {p.tires} tires · CPU: {p.cpuRange[0]}-{p.cpuRange[1]}t · I/O: {p.ioRange[0]}-{p.ioRange[1]}t · Priority: {p.defaultPriority}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingType(p)}
                        className="p-1.5 border border-[#1A1A1A]/20 hover:bg-[#F6EFE0] rounded"
                        title="Edit Type"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteType(p.id)}
                        className="p-1.5 border border-[#B3261E]/30 text-[#B3261E] hover:bg-[#B3261E]/10 rounded"
                        title="Delete Type"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: VEHICLE MODELS */}
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#1A1A1A]">Customer Vehicle Models</span>
                <button
                  onClick={() =>
                    setEditingModel({
                      name: '',
                      vehicleTypeId: localSettings.vehicleProfiles[0]?.id || 'sedan',
                      tireSpec: localSettings.tireCatalog[0]?.size || '195/65 R15',
                      tireCount: 4,
                    })
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#CC5500] text-white rounded-lg font-medium hover:bg-[#A84500]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Model</span>
                </button>
              </div>

              {/* Model Form */}
              {editingModel && (
                <div className="p-4 bg-[#F6EFE0] border border-[#CC5500]/40 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-[#CC5500]">
                    {editingModel.id ? 'Edit Model' : 'Create New Model'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Model Name</label>
                      <input
                        type="text"
                        value={editingModel.name || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                        placeholder="e.g. Mazda 3 Sport"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Linked Vehicle Type</label>
                      <select
                        value={editingModel.vehicleTypeId || ''}
                        onChange={(e) => {
                          const typeId = e.target.value;
                          const found = localSettings.vehicleProfiles.find((p) => p.id === typeId);
                          setEditingModel({
                            ...editingModel,
                            vehicleTypeId: typeId,
                            tireCount: found ? found.tires : 4,
                          });
                        }}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                      >
                        {localSettings.vehicleProfiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.tires} tires)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Tire Spec / Size</label>
                      <input
                        type="text"
                        value={editingModel.tireSpec || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, tireSpec: e.target.value })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                        placeholder="e.g. 205/55 R16"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Tires Needed</label>
                      <input
                        type="number"
                        min="2"
                        max="16"
                        value={editingModel.tireCount || 4}
                        onChange={(e) => setEditingModel({ ...editingModel, tireCount: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingModel(null)}
                      className="px-3 py-1.5 border border-[#1A1A1A]/30 rounded hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!editingModel.name) {
                          showToast('Model name is required.', true);
                          return;
                        }
                        const id = editingModel.id || `model_${Date.now()}`;
                        const fullModel: VehicleModel = {
                          id,
                          name: editingModel.name!,
                          vehicleTypeId: editingModel.vehicleTypeId || 'sedan',
                          tireSpec: editingModel.tireSpec || '185/60 R15',
                          tireCount: Number(editingModel.tireCount) || 4,
                        };
                        const updated = localSettings.vehicleModels.some((m) => m.id === id)
                          ? localSettings.vehicleModels.map((m) => (m.id === id ? fullModel : m))
                          : [...localSettings.vehicleModels, fullModel];
                        setLocalSettings({ ...localSettings, vehicleModels: updated });
                        setEditingModel(null);
                        showToast('Model saved.');
                      }}
                      className="px-3 py-1.5 bg-[#CC5500] text-white rounded font-medium"
                    >
                      Save Model
                    </button>
                  </div>
                </div>
              )}

              {/* Models List */}
              <div className="divide-y divide-[#E4D9C3] border border-[#E4D9C3] rounded-xl bg-white overflow-hidden">
                {localSettings.vehicleModels.map((m) => (
                  <div key={m.id} className="p-3 flex items-center justify-between hover:bg-[#F6EFE0]/40">
                    <div>
                      <div className="font-bold text-sm text-[#1A1A1A]">{m.name}</div>
                      <div className="text-[11px] text-[#1A1A1A]/70">
                        Type: {m.vehicleTypeId} · Tire Size: {m.tireSpec} ({m.tireCount} tires)
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingModel(m)}
                        className="p-1.5 border border-[#1A1A1A]/20 hover:bg-[#F6EFE0] rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (localSettings.vehicleModels.length <= 1) {
                            showToast('Cannot delete the last model.', true);
                            return;
                          }
                          setLocalSettings({
                            ...localSettings,
                            vehicleModels: localSettings.vehicleModels.filter((item) => item.id !== m.id),
                          });
                          showToast('Model deleted.');
                        }}
                        className="p-1.5 border border-[#B3261E]/30 text-[#B3261E] hover:bg-[#B3261E]/10 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TIRE CATALOG */}
          {activeTab === 'tires' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#1A1A1A]">Shared Tire Inventory Catalog</span>
                <button
                  onClick={() =>
                    setEditingTire({
                      brand: '',
                      model: '',
                      size: '',
                      price: 3500,
                      stock: 12,
                      reserved: 0,
                    })
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#CC5500] text-white rounded-lg font-medium hover:bg-[#A84500]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tire Catalog Item</span>
                </button>
              </div>

              {/* Tire Form */}
              {editingTire && (
                <div className="p-4 bg-[#F6EFE0] border border-[#CC5500]/40 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-[#CC5500]">
                    {editingTire.id ? 'Edit Tire Catalog Item' : 'Add New Tire to Catalog'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Brand</label>
                      <input
                        type="text"
                        value={editingTire.brand || ''}
                        onChange={(e) => setEditingTire({ ...editingTire, brand: e.target.value })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                        placeholder="e.g. Michelin"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Model Line</label>
                      <input
                        type="text"
                        value={editingTire.model || ''}
                        onChange={(e) => setEditingTire({ ...editingTire, model: e.target.value })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                        placeholder="e.g. Pilot Sport 4"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Size Specification</label>
                      <input
                        type="text"
                        value={editingTire.size || ''}
                        onChange={(e) => setEditingTire({ ...editingTire, size: e.target.value })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                        placeholder="e.g. 205/55 R16"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Price per Tire (₱ / $)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingTire.price || 0}
                        onChange={(e) => setEditingTire({ ...editingTire, price: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Initial Stock Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={editingTire.stock || 0}
                        onChange={(e) => setEditingTire({ ...editingTire, stock: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E4D9C3] rounded px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingTire(null)}
                      className="px-3 py-1.5 border border-[#1A1A1A]/30 rounded hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button onClick={saveTire} className="px-3 py-1.5 bg-[#CC5500] text-white rounded font-medium">
                      Save Tire
                    </button>
                  </div>
                </div>
              )}

              {/* Tire Catalog List */}
              <div className="divide-y divide-[#E4D9C3] border border-[#E4D9C3] rounded-xl bg-white overflow-hidden">
                {localSettings.tireCatalog.map((t) => (
                  <div key={t.id} className="p-3 flex items-center justify-between hover:bg-[#F6EFE0]/40">
                    <div>
                      <div className="font-bold text-sm text-[#1A1A1A]">
                        {t.brand} {t.model} <span className="font-mono text-xs text-[#CC5500]">({t.size})</span>
                      </div>
                      <div className="text-[11px] text-[#1A1A1A]/70">
                        Price: ₱{t.price.toLocaleString()} · Current Stock: <strong>{t.stock}</strong> in stock ({t.reserved} reserved)
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingTire(t)}
                        className="p-1.5 border border-[#1A1A1A]/20 hover:bg-[#F6EFE0] rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTire(t.id)}
                        className="p-1.5 border border-[#B3261E]/30 text-[#B3261E] hover:bg-[#B3261E]/10 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#1A1A1A]">Saved Customer Order Presets</span>
              </div>
              <div className="divide-y divide-[#E4D9C3] border border-[#E4D9C3] rounded-xl bg-white overflow-hidden">
                {localSettings.orderPresets.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between hover:bg-[#F6EFE0]/40">
                    <div>
                      <div className="font-bold text-sm text-[#1A1A1A]">{p.name}</div>
                      <div className="text-[11px] text-[#1A1A1A]/70">
                        {p.modelId} ({p.vehicleTypeId}) · {p.tireCount}x {p.tireSpec} · Priority: {p.priority}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setLocalSettings({
                          ...localSettings,
                          orderPresets: localSettings.orderPresets.filter((item) => item.id !== p.id),
                        });
                        showToast('Preset deleted.');
                      }}
                      className="p-1.5 border border-[#B3261E]/30 text-[#B3261E] hover:bg-[#B3261E]/10 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer: Actions */}
        <div className="px-6 py-4 bg-[#F6EFE0] border-t border-[#E4D9C3] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1 px-3 py-2 border border-[#B3261E] text-[#B3261E] hover:bg-[#B3261E]/10 rounded-lg font-medium transition-colors"
              title="Reset all settings to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1 px-3 py-2 border border-[#1A1A1A]/30 hover:bg-white rounded-lg text-[#1A1A1A] font-medium transition-colors"
              title="Export configuration as JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <label className="flex items-center gap-1 px-3 py-2 border border-[#1A1A1A]/30 hover:bg-white rounded-lg text-[#1A1A1A] font-medium transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#CC5500] hover:bg-[#A84500] text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
