import React from 'react';
import type { CustomerInfo } from '../../hooks/useOrderCheckout';
import type { Database } from '../../types/supabase';

type Settings = Database['public']['Tables']['restaurant_settings']['Row'];

interface DeliveryTypeSelectorProps {
  settings: Settings | null;
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
}

interface DeliveryOption {
  type: 'delivery' | 'table' | 'takeaway';
  icon: string;
  label: string;
  isSelected: (info: CustomerInfo) => boolean;
  onChange: (info: CustomerInfo) => CustomerInfo;
}

export default function DeliveryTypeSelector({
  settings,
  customerInfo,
  setCustomerInfo
}: DeliveryTypeSelectorProps) {
  const availableOptions = [
    settings?.has_delivery,
    settings?.has_table_service,
    settings?.has_takeaway
  ].filter(Boolean).length;

  if (availableOptions <= 1) {
    return null;
  }

  const deliveryOptions: DeliveryOption[] = [
    {
      type: 'delivery',
      icon: 'fa-motorcycle',
      label: 'Entregar em casa',
      isSelected: (info) => !info.isAtRestaurant && !info.isTakeaway,
      onChange: (info) => ({ ...info, isAtRestaurant: false, isTakeaway: false, address: '' })
    },
    {
      type: 'table',
      icon: 'fa-utensils',
      label: 'Receber na mesa',
      isSelected: (info) => info.isAtRestaurant && !info.isTakeaway,
      onChange: (info) => ({ ...info, isAtRestaurant: true, isTakeaway: false, address: '' })
    },
    {
      type: 'takeaway',
      icon: 'fa-person-walking',
      label: 'Retirada',
      isSelected: (info) => info.isTakeaway,
      onChange: (info) => ({ ...info, isAtRestaurant: false, isTakeaway: true, address: '' })
    }
  ];

  const getAvailableOptions = () => {
    const options: DeliveryOption[] = [];
    if (settings?.has_delivery) options.push(deliveryOptions[0]);
    if (settings?.has_table_service) options.push(deliveryOptions[1]);
    if (settings?.has_takeaway) options.push(deliveryOptions[2]);
    return options;
  };

  return (
    <div className="flex flex-col gap-3">
      {getAvailableOptions().map((option) => {
        const isSelected = option.isSelected(customerInfo);
        return (
          <label
            key={option.type}
            className={`relative flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'bg-accent/10 border-2 border-accent shadow-card'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <input
              type="radio"
              name="deliveryType"
              checked={isSelected}
              onChange={() => setCustomerInfo(option.onChange(customerInfo))}
              className="hidden"
            />
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isSelected
                ? 'border-accent bg-accent'
                : 'border-gray-300 bg-gray-50'
            }`}>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-gray-50" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <i className={`fas ${option.icon} ${isSelected ? 'text-accent' : 'text-gray-600'}`}></i>
              <span className={`font-medium ${isSelected ? 'text-accent' : 'text-gray-700'}`}>
                {option.label}
              </span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
