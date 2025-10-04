'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { FaCamera } from 'react-icons/fa';
import Image from 'next/image';
import { useNotification } from '../context/NotificationContext';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: { name: string; observations: string; cargo: string; edital: string; banca?: string; imageFile?: File; existingIconUrl?: string }) => void;
  initialPlanData?: { name: string; observations: string; cargo?: string; edital?: string; banca?: string; iconUrl?: string; };
  isEditing?: boolean;
}

  const CreatePlanModal: React.FC<CreatePlanModalProps> = ({ isOpen, onClose, onSave, initialPlanData, isEditing }) => {
  const { showNotification } = useNotification();
  const [planName, setPlanName] = useState(initialPlanData?.name || '');
  const [observations, setObservations] = useState(initialPlanData?.observations || '');
  const [cargo, setCargo] = useState(initialPlanData?.cargo || '');
  const [edital, setEdital] = useState(initialPlanData?.edital || '');
  const [banca, setBanca] = useState(initialPlanData?.banca || ''); // Novo estado para a banca
  const [imageFile, setImageFile] = useState<File | undefined>(undefined); // Only set if a new file is selected
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPlanData?.iconUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to update state when initialPlanData changes (e.g., when modal is reused for different plans)
  React.useEffect(() => {
    if (initialPlanData) {
      setPlanName(initialPlanData.name);
      setObservations(initialPlanData.observations);
      setCargo(initialPlanData.cargo || ''); // Adicionado para garantir que o cargo seja atualizado
      setEdital(initialPlanData.edital || ''); // Adicionado para garantir que o edital seja atualizado
      setBanca(initialPlanData.banca || ''); // Adicionado para garantir que a banca seja atualizada
      setPreviewUrl(initialPlanData.iconUrl || null);
      setImageFile(undefined); // Clear any previously selected new image
    } else {
      // Reset for new plan creation
      setPlanName('');
      setObservations('');
      setCargo(''); // Reset cargo
      setEdital(''); // Reset edital
      setBanca(''); // Reset banca
      setPreviewUrl(null);
      setImageFile(undefined);
    }
  }, [initialPlanData]);

  if (!isOpen) return null;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(undefined);
      if (!initialPlanData?.iconUrl) { // Only clear preview if no initial image
        setPreviewUrl(null);
      }
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    if (planName.trim()) {
      onSave({
        name: planName,
        observations,
        cargo,
        edital,
        banca, // Incluindo a banca
        imageFile: imageFile,
        existingIconUrl: imageFile ? undefined : initialPlanData?.iconUrl
      });
    } else {
      showNotification('O nome do plano não pode estar vazio.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl transform transition-transform duration-300 ease-out scale-100">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">{isEditing ? 'Editar Plano' : 'Seu Plano'}</h2>
        
        <div className="flex gap-8">
          {/* Lado Esquerdo: Imagem */}
          <div className="flex flex-col items-center justify-center w-1/3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
            <div 
              className="w-40 h-40 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2 cursor-pointer overflow-hidden"
              onClick={handleImageClick}
            >
              {previewUrl ? (
                <Image src={previewUrl} alt="Pré-visualização" width={160} height={160} className="object-cover w-full h-full" />
              ) : (
                <FaCamera className="text-gray-500 dark:text-gray-400" size={48} />
              )}
            </div>
            <button 
              onClick={handleImageClick}
              className="text-sm text-amber-600 hover:text-amber-800 font-semibold dark:text-amber-400 dark:hover:text-amber-300"
            >
              Alterar Imagem
            </button>
          </div>

          {/* Lado Direito: Formulário */}
          <div className="flex-1">
            <form>
              <div className="mb-4">
                <label htmlFor="planName" className="block text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
                  NOME
                </label>
                <input
                  type="text"
                  id="planName"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Meu Plano"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="cargo" className="block text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
                  CARGO (Opcional)
                </label>
                <input
                  type="text"
                  id="cargo"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Analista Judiciário"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="edital" className="block text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
                  EDITAL (Opcional)
                </label>
                <input
                  type="text"
                  id="edital"
                  value={edital}
                  onChange={(e) => setEdital(e.target.value)}
                  placeholder="Ex: Edital 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="banca" className="block text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
                  BANCA (Opcional)
                </label>
                <input
                  type="text"
                  id="banca"
                  value={banca}
                  onChange={(e) => setBanca(e.target.value)}
                  placeholder="Ex: FGV, Cebraspe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="observations" className="block text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
                  OBSERVAÇÕES (Opcional)
                </label>
                <textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Aqui você pode escrever alguma observação sobre o seu plano"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            Avançar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePlanModal;
