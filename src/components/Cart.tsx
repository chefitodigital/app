import React, { useState, useCallback, useMemo } from 'react';
import { useCartStore } from '../store/cart';
import { DEFAULT_ORDER_CONFIRMATION } from '../lib/orderMessages';
import { useCartCoupon } from '../hooks/useCartCoupon';
import { useOrderCheckout } from '../hooks/useOrderCheckout';
import { useThemeStore } from '../store/theme';
import CartButton from './cart/CartButton';
import CartItems from './cart/CartItems';
import CartSummary from './cart/CartSummary';
import CustomerForm from './cart/CustomerForm';
import OrderConfirmationModal from './modals/OrderConfirmationModal';
import { isOpenNow, nextOpening, type OperatingSchedule } from '../lib/operatingHours';
import { getDeliveryMinimumShortfall } from '../lib/checkoutRules';

export default function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [lastOrderResult, setLastOrderResult] = useState<{ paymentMethod?: 'cash' | 'mbway' | 'pix'; orderSequence?: number | null; publicUrl?: string; total?: number } | null>(null);
  const { items, getTotal, updateQuantity, removeItem, clearCart } = useCartStore();
  const { settings, formatCurrency } = useThemeStore();

  const total = getTotal();

  const schedule = settings?.operating_schedule as OperatingSchedule | null | undefined;
  const open = useMemo(() => isOpenNow(schedule ?? null), [schedule]);
  const nextOpen = useMemo(() => (open ? null : nextOpening(schedule ?? null)), [open, schedule]);

  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isValidatingCoupon,
    calculateDiscount,
    handleApplyCoupon,
    handleRemoveCoupon,
    resetCoupon,
  } = useCartCoupon();

  const {
    showCustomerForm,
    customerInfo,
    savedAddresses,
    savedAddressCoords,
    setCustomerInfo,
    initiateCheckout,
    submitOrder,
    getAddressLabel,
    getAddressPlaceholder,
    getDeliveryFee,
    returnToCart,
  } = useOrderCheckout();

  const discountAmount = useMemo(() => calculateDiscount(total), [calculateDiscount, total]);
  const deliveryFee = useMemo(() => getDeliveryFee(), [getDeliveryFee]);
  const finalTotal = useMemo(() => total - discountAmount, [total, discountAmount]);
  const deliveryMinimumOrderValue = settings?.delivery_minimum_order_value ?? 0;
  const isDeliveryOrder = !customerInfo.isAtRestaurant && !customerInfo.isTakeaway;
  const amountNeededForDelivery = getDeliveryMinimumShortfall(
    total,
    discountAmount,
    deliveryMinimumOrderValue,
    isDeliveryOrder,
  );
  const canProceedToCheckout = true;

  const handleCheckout = useCallback(() => {
    if (!canProceedToCheckout) return;

    initiateCheckout(items.length);
  }, [canProceedToCheckout, initiateCheckout, items.length]);

  const handleApplyCouponWithTotal = useCallback(() => {
    handleApplyCoupon(total);
  }, [handleApplyCoupon, total]);

  const handleSubmitOrder = useCallback(async () => {
    const result = await submitOrder(
      items,
      total,
      discountAmount,
      appliedCoupon
    );

    if (result.success) {
      setLastOrderResult({
        paymentMethod: result.paymentMethod,
        orderSequence: result.orderSequence,
        publicUrl: result.publicUrl,
        total: total - discountAmount + deliveryFee,
      });
      setIsOpen(false);
      setIsConfirmationModalOpen(true);
    }
  }, [submitOrder, items, total, discountAmount, appliedCoupon, deliveryFee]);

  const handleCloseConfirmation = useCallback(() => {
    setIsConfirmationModalOpen(false);
    setLastOrderResult(null);
    clearCart();
    resetCoupon();
  }, [clearCart, resetCoupon]);

  const handleClose = useCallback(() => {
    if (showCustomerForm) {
      return;
    }
    setIsOpen(false);
  }, [showCustomerForm]);

  const handleBackOrClose = useCallback(() => {
    if (showCustomerForm) {
      setCustomerInfo(prev => ({ ...prev }));
    }
    setIsOpen(false);
  }, [showCustomerForm, setCustomerInfo]);

  return (
    <>
      <CartButton itemCount={items.length} onClick={() => setIsOpen(true)} />

      {isOpen && (
        <div className="fixed inset-0 z-[70] overflow-hidden">
          <div className="absolute inset-0 bg-gray-950/30 backdrop-blur-sm" onClick={handleClose} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-gray-50 shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 font-title">Carrinho</h2>
                <button
                  onClick={handleBackOrClose}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="fas fa-xmark text-lg sm:text-xl"></i>
                </button>
              </div>

              {showCustomerForm ? (
                <CustomerForm
                  customerInfo={customerInfo}
                  savedAddresses={savedAddresses}
                  savedAddressCoords={savedAddressCoords}
                  setCustomerInfo={setCustomerInfo}
                  onSubmit={handleSubmitOrder}
                  onBack={returnToCart}
                  getAddressLabel={getAddressLabel}
                  getAddressPlaceholder={getAddressPlaceholder}
                  deliveryFee={deliveryFee}
                  deliveryMinimumOrderValue={deliveryMinimumOrderValue}
                  amountNeededForDelivery={amountNeededForDelivery}
                />
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <CartItems
                      items={items}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  </div>

                  <CartSummary
                    itemCount={items.length}
                    total={total}
                    discountAmount={discountAmount}
                    deliveryFee={deliveryFee}
                    finalTotal={finalTotal}
                    deliveryMinimumOrderValue={deliveryMinimumOrderValue}
                    amountNeededForDelivery={0}
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    appliedCoupon={appliedCoupon}
                    isValidatingCoupon={isValidatingCoupon}
                    onApplyCoupon={handleApplyCouponWithTotal}
                    onRemoveCoupon={handleRemoveCoupon}
                    onCheckout={handleCheckout}
                  />
                  {!open && (
                    <div className="mx-4 mb-4 sm:mx-6 p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-sm flex items-start gap-2">
                      <i className="fas fa-clock mt-0.5" />
                      <div>
                        <strong>Estamos fechados.</strong>
                        {nextOpen && <> Reabrimos {nextOpen.label}. Pode fazer o pedido e será preparado assim que abrirmos.</>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <OrderConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={handleCloseConfirmation}
        message={settings?.order_confirmation_message || DEFAULT_ORDER_CONFIRMATION}
        paymentMethod={lastOrderResult?.paymentMethod}
        mbwayPhone={settings?.mbway_phone}
        mbwayReferencePrefix={settings?.mbway_reference_prefix}
        orderSequence={lastOrderResult?.orderSequence}
        publicUrl={lastOrderResult?.publicUrl}
        total={lastOrderResult?.total}
        formatCurrency={formatCurrency}
      />
    </>
  );
}
