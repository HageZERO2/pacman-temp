export function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="coin-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#e08a00" />
      <circle cx="12" cy="11" r="10" fill="#ffc93c" />
      <circle cx="12" cy="11" r="7" fill="none" stroke="#e08a00" strokeWidth="1.4" />
      <path d="M12 6.5 L13.3 9.6 L16.6 9.8 L14 11.9 L14.9 15.1 L12 13.3 L9.1 15.1 L10 11.9 L7.4 9.8 L10.7 9.6 Z" fill="#fff6c4" />
    </svg>
  );
}

export function CoinCounter({ coins, label = true }: { coins: number; label?: boolean }) {
  return (
    <div className="coins" aria-label={`${coins} coins`}>
      <CoinIcon />
      <span className="coins__value">{coins.toLocaleString('en-US')}</span>
      {label && <span className="coins__label">COINS</span>}
    </div>
  );
}
