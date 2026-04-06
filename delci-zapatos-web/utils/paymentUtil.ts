export const getSuggestedPaymentAmount = (biweeklyAmount: number, remainingAmount: number): number => {
	if (!Number.isFinite(biweeklyAmount) || !Number.isFinite(remainingAmount)) return 0;
	if (remainingAmount <= 0) return 0;
	if (biweeklyAmount <= 0) return remainingAmount;
	return Math.min(biweeklyAmount, remainingAmount);
};

export const validatePaymentAmount = (amount: number, remainingAmount: number): string | null => {
	if (!Number.isFinite(amount) || amount <= 0) {
		return 'El monto del pago debe ser mayor a 0';
	}

	if (!Number.isFinite(remainingAmount) || remainingAmount <= 0) {
		return 'La cuenta no tiene saldo pendiente';
	}

	if (amount > remainingAmount) {
		return 'El monto del pago no puede ser mayor al saldo pendiente';
	}

	return null;
};
