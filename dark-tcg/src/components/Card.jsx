import { CARDS, CARD_TYPES, ENERGY_TYPES } from '../data/cards.js';
import './Card.css';

function Card({ 
  cardId, 
  instanceId, 
  currentHealth, 
  canPlay = true, 
  canAttack = false, 
  onClick, 
  isInHand = false, 
  isOnBattlefield = false,
  isAttacking = false,
  isValidTarget = false 
}) {
  const card = CARDS[cardId];
  
  if (!card) return null;
  
  const handleClick = () => {
    if (onClick) {
      onClick(cardId, instanceId);
    }
  };
  
  const getEnergyIcon = (energyType) => {
    // Return CSS class for pixel art icons
    return `energy-icon-${energyType}`;
  };
  
  const getRarityClass = (rarity) => {
    return `card-${rarity}`;
  };
  
  const getCardTypeClass = () => {
    return `card-${card.type}`;
  };
  
  const renderCost = () => {
    if (card.type === CARD_TYPES.ENERGY || !card.cost) return null;
    
    return (
      <div className="card-cost">
        {Object.entries(card.cost).map(([energyType, amount]) => (
          <span key={energyType} className={`cost-${energyType}`}>
            {amount}<span className={getEnergyIcon(energyType)}></span>
          </span>
        ))}
      </div>
    );
  };
  
  const renderStats = () => {
    if (card.type !== CARD_TYPES.CREATURE) return null;
    
    const displayHealth = isOnBattlefield && currentHealth !== undefined ? currentHealth : card.health;
    const healthClass = isOnBattlefield && currentHealth < card.health ? 'damaged' : '';
    
    return (
      <div className="card-stats">
        <span className="attack">{card.attack}<span className="icon-attack"></span></span>
        <span className={`health ${healthClass}`}>{displayHealth}<span className="icon-health"></span></span>
      </div>
    );
  };
  
  const renderAbilities = () => {
    if (!card.abilities || card.abilities.length === 0) return null;
    
    return (
      <div className="card-abilities">
        {card.abilities.map((ability, index) => (
          <div key={index} className="ability">
            {ability}
          </div>
        ))}
      </div>
    );
  };
  
  const getCardClasses = () => {
    const classes = [
      'card',
      getCardTypeClass(),
      getRarityClass(card.rarity),
      !canPlay ? 'disabled' : '',
      canAttack ? 'can-attack' : '',
      isInHand ? 'in-hand' : '',
      isOnBattlefield ? 'on-battlefield' : '',
      isAttacking ? 'attacking' : '',
      isValidTarget ? 'valid-target' : ''
    ];
    
    return classes.filter(c => c).join(' ');
  };
  
  return (
    <div 
      className={getCardClasses()}
      onClick={handleClick}
    >
      {renderCost()}
      
      <div className="card-header">
        <h3 className="card-name">{card.name}</h3>
        <span className="card-type">{card.type}</span>
      </div>
      
      <div className="card-body">
        <p className="card-description">{card.description}</p>
        {renderAbilities()}
      </div>
      
      {renderStats()}
      
      {card.type === CARD_TYPES.ENERGY && (
        <div className="energy-type">
          <span className={getEnergyIcon(card.energyType)}></span>
        </div>
      )}
    </div>
  );
}

export default Card;