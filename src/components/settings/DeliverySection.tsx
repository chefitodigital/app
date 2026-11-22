import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Toggle, ToggleGroup } from '../ui/Toggle';
import { useThemeStore } from '../../store/theme';
import { NumericInput } from '../ui/NumericInput';

interface DeliverySectionProps {
  formData: {
    has_delivery: boolean;
    has_table_service: boolean;
    has_takeaway: boolean;
    delivery_base_price: number;
    delivery_minimum_order_value: number;
  };
  onChange: (data: Partial<DeliverySectionProps['formData']>) => void;
}

export function DeliverySection({ formData, onChange }: DeliverySectionProps) {
  const { formatCurrency } = useThemeStore();

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle description="Configure as opções de entrega disponíveis">
          Opções de Entrega
        </CardTitle>
      </CardHeader>

      <ToggleGroup>
        <Toggle
          checked={formData.has_delivery}
          onChange={(checked) => onChange({ has_delivery: checked })}
          icon="motorcycle"
          label="Entregar em casa"
          description="Permite que os clientes recebam pedidos em casa"
        />
        <Toggle
          checked={formData.has_table_service}
          onChange={(checked) => onChange({ has_table_service: checked })}
          icon="utensils"
          label="Receber na mesa"
          description="Para clientes que estão no restaurante"
        />
        <Toggle
          checked={formData.has_takeaway}
          onChange={(checked) => onChange({ has_takeaway: checked })}
          icon="person-walking"
          label="Retirada"
          description="O cliente retira o pedido no local"
        />
      </ToggleGroup>
    </Card>
    <Card>
      <CardHeader><CardTitle description="Valor fixo cobrado em pedidos para entrega.">Frete padrão</CardTitle></CardHeader>
      <div className="input-group">
        <label className="input-label" htmlFor="delivery-base-price">Valor do frete</label>
        <NumericInput id="delivery-base-price" min="0" step="0.01" value={formData.delivery_base_price} onValueChange={(value) => onChange({ delivery_base_price: Math.max(0, value) })} className="input" />
        <p className="mt-2 text-sm text-gray-500">Use 0 para oferecer entrega grátis.</p>
      </div>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle description="Aplicado aos pedidos de entrega depois dos descontos e sem incluir o frete.">
          Pedido mínimo para entrega
        </CardTitle>
      </CardHeader>
      <div className="input-group">
        <label className="input-label" htmlFor="delivery-minimum-order-value">Valor mínimo</label>
        <NumericInput
          id="delivery-minimum-order-value"
          min="0"
          step="0.01"
          value={formData.delivery_minimum_order_value}
          onValueChange={(value) => onChange({ delivery_minimum_order_value: Math.max(0, value) })}
          className="input"
        />
        <p className="mt-2 text-sm text-gray-500">
          Use 0 para não exigir valor mínimo. Valor atual: {formatCurrency(formData.delivery_minimum_order_value)}.
        </p>
      </div>
    </Card>
    </div>
  );
}
