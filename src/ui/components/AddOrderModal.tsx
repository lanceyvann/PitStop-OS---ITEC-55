import React, { useState, useEffect } from 'react';
import { UserShopSettings } from '../../config/settingsStorage';
import { PCB } from '../../models/pcb';
import { generateBurstPlan, buildPCB } from '../../config/workloads';
import { Mulberry32 } from '../../config/prng';
import { X, Plus, AlertCircle, Car, ShieldAlert } from 'lucide-react';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: (order: PCB) => void;
  nextPid: number;
  currentClock: number;
  settings: UserShopSettings;
  existingPcbs: Record<number, PCB>;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmitOrder,
  nextPid,
  currentClock,
  settings,
  existingPcbs,
}) => {
  const [vehicleTypeId, setVehicleTypeId] = useState<string>('sedan');
  const [modelId, setModelId] = useState<string>('');
  const [customModelName, setCustomModelName] = useState<string>('');
  const [tireId, setTireId] = useState<string>('');
  const [tireCount, setTireCount] = useState<number>(4);
  const [priority, setPriority] = useState<number>(4);
  const [arrivalTime, setArrivalTime] = useState<number>(currentClock);
  const [parentPid, setParentPid] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const vType = settings.vehicleProfiles.find((p) => p.id === vehicleTypeId);
    if (vType) {
      setTireCount(vType.tires);
      setPriority(vType.defaultPriority);

      const modelsForType = settings.vehicleModels.filter((m) => m.vehicleTypeId === vehicleTypeId);
      if (modelsForType.length > 0) {
        setModelId(modelsForType[0].id);
        const matchingTire = settings.tireCatalog.find((t) => t.size === modelsForType[0].tireSpec);
        setTireId(matchingTire ? matchingTire.id : settings.tireCatalog[0]?.id || '');
      } else {
        setModelId('custom');
      }
    }
  }, [vehicleTypeId, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Validations
    if (tireCount <= 0) {
      setErrorMsg('Tire quantity must be greater than 0.');
      return;
    }
    if (priority < 1 || priority > 10) {
      setErrorMsg('Priority must be between 1 and 10.');
      return;
    }
    if (arrivalTime < 0) {
      setErrorMsg('Arrival time cannot be negative.');
      return;
    }

    const vType = settings.vehicleProfiles.find((p) => p.id === vehicleTypeId) || settings.vehicleProfiles[0];
    const selectedModel = settings.vehicleModels.find((m) => m.id === modelId);
    const finalModelName = selectedModel ? selectedModel.name : customModelName.trim() || `${vType.name} Custom`;

    const selectedTire = settings.tireCatalog.find((t) => t.id === tireId) || settings.tireCatalog[0];
    const finalTireSpec = selectedTire ? selectedTire.size : '195/65 R15';

    const prng = new Mulberry32(Date.now());
    const burstPlan = generateBurstPlan(
      tireCount,
      vType.cpuRange[0],
      vType.cpuRange[1],
      vType.ioRange[0],
      vType.ioRange[1],
      prng
    );

    const newPcb = buildPCB(
      {
        pid: nextPid,
        name: `${finalModelName} Order #${nextPid}`,
        vehicleTypeId: vType.id,
        modelId: finalModelName,
        tireSpec: finalTireSpec,
        tireCount,
        priority,
        arrivalTime,
        burstPlan,
        parentPid,
      },
      nextPid
    );

    onSubmitOrder(newPcb);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#FFFAF0] rounded-xl shadow-2xl border border-[#E4D9C3] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-3.5 bg-[#F6EFE0] border-b border-[#E4D9C3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#CC5500] text-white flex items-center justify-center font-bold text-xs font-mono">
              #{nextPid}
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#1A1A1A]">New Customer Tire Order</h3>
              <p className="text-[11px] text-[#1A1A1A]/70">Admit a new process into the Tire Shop OS simulator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border border-[#1A1A1A]/20 hover:bg-white text-[#1A1A1A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-[#B3261E]/10 border border-[#B3261E]/30 text-[#B3261E] flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Vehicle Type */}
            <div>
              <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Vehicle Classification</label>
              <select
                value={vehicleTypeId}
                onChange={(e) => setVehicleTypeId(e.target.value)}
                className="w-full bg-[#F6EFE0] border border-[#E4D9C3] rounded-lg px-2.5 py-1.5 font-medium"
              >
                {settings.vehicleProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.tires} wheels)
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Vehicle Model</label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full bg-[#F6EFE0] border border-[#E4D9C3] rounded-lg px-2.5 py-1.5 font-medium"
              >
                {settings.vehicleModels
                  .filter((m) => m.vehicleTypeId === vehicleTypeId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.tireSpec})
                    </option>
                  ))}
                <option value="custom">-- Custom Model Name --</option>
              </select>
            </div>
          </div>

          {/* If Custom Model */}
          {modelId === 'custom' && (
            <div>
              <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Custom Vehicle Name</label>
              <input
                type="text"
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                placeholder="e.g. Vintage Volkswagen Beetle"
                className="w-full bg-[#F6EFE0] border border-[#E4D9C3] rounded-lg px-2.5 py-1.5"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Tire Catalog Choice */}
            <div>
              <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Tire Stock Selection</label>
              <select
                value={tireId}
                onChange={(e) => setTireId(e.target.value)}
                className="w-full bg-[#F6EFE0] border border-[#E4D9C3] rounded-lg px-2.5 py-1.5 font-medium"
              >
                {settings.tireCatalog.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.brand} {t.size} (Stock: {t.stock})
                  </option>
                ))}
              </select>
            </div>

            {/* Tire Quantity */}
            <div>
              <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Tires Quantity Needed</label>
              <input
                type="number"
                min="1"
                max="16"
                value={tireCount}
                onChange={(e) => setTireCount(Number(e.target.value))}
                className="w-full bg-[#F6EFE0] border border-[#E4D9C3] rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Priority (1 to 10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-[#F6EFE0] border border-[#E4D9C3] rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>

            {/* Arrival Time */}
            <div>
              <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Arrival Clock Tick</label>
              <input
                type="number"
                min="0"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(Number(e.target.value))}
                className="w-full bg-[#F6EFE0] border border-[#E4D9C3] rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>

            {/* Parent Order (Optional Fleet Hierarchy) */}
            <div>
              <label className="block text-[11px] font-medium text-[#1A1A1A]/70 mb-1">Parent Order (Fleet)</label>
              <select
                value={parentPid || ''}
                onChange={(e) => setParentPid(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-[#F6EFE0] border border-[#E4D9C3] rounded-lg px-2.5 py-1.5 font-mono"
              >
                <option value="">None (Independent)</option>
                {Object.values(existingPcbs)
                  .filter((p) => p.state !== 'TERMINATED')
                  .map((p) => (
                    <option key={p.pid} value={p.pid}>
                      #{p.pid} ({p.modelName})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E4D9C3] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#1A1A1A]/30 rounded-lg hover:bg-[#F6EFE0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#CC5500] hover:bg-[#A84500] text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Submit & Admit Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
