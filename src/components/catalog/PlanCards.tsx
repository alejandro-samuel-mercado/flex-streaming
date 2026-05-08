'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Zap, MessageCircle } from 'lucide-react';

interface PlanData {
    id: string;
    name: string;
    description: string | null;
    price: string;
    durationDays: number;
    maxDevices: number;
    hasHd: boolean;
    has4k: boolean;
    allowDownload: boolean;
    noAds: boolean;
}

interface PlanCardsProps {
    plans: PlanData[];
    whatsappNumber?: string;
}

export default function PlanCards({ plans, whatsappNumber }: PlanCardsProps) {
    if (plans.length === 0) return null;

    const phone = whatsappNumber || '+5491100000000';

    const handleSelectPlan = (plan: PlanData) => {
        const message = encodeURIComponent(
            `¡Hola! Me interesa el plan "${plan.name}" de Nuba por $${plan.price}. ¿Podrían darme más información?`
        );
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    };

    const icons = [Sparkles, Crown, Zap];
    const accents = [
        { from: '#00D4FF', to: '#0099CC', glow: 'rgba(0,212,255,0.3)' },
        { from: '#FF6B00', to: '#FF9500', glow: 'rgba(255,107,0,0.3)' },
        { from: '#A855F7', to: '#7C3AED', glow: 'rgba(168,85,247,0.3)' },
    ];

    return (
        <section className="plans-section" id="planes">
            <div className="plans-bg-decoration" aria-hidden="true" />

            <div className="section-header section-header--center">
                <h2 className="section-title section-title--large">
                    Elige tu <span className="section-title-gradient">Plan Perfecto</span>
                </h2>
                <p className="section-subtitle">
                    Accede a miles de películas, series y más contenido exclusivo
                </p>
            </div>

            <div className="plans-grid">
                {plans.map((plan, index) => {
                    const Icon = icons[index % icons.length];
                    const accent = accents[index % accents.length];
                    const isPopular = index === 1 || plans.length === 1;

                    return (
                        <motion.div
                            key={plan.id}
                            className={`plan-card ${isPopular ? 'plan-card--popular' : ''}`}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            style={{
                                '--plan-accent-from': accent.from,
                                '--plan-accent-to': accent.to,
                                '--plan-glow': accent.glow,
                            } as React.CSSProperties}
                        >
                            {isPopular && (
                                <div className="plan-card-popular-badge">
                                    <Crown size={12} /> Más Popular
                                </div>
                            )}

                            <div className="plan-card-icon">
                                <Icon size={28} />
                            </div>

                            <h3 className="plan-card-name">{plan.name}</h3>

                            <div className="plan-card-price">
                                <span className="plan-card-currency">$</span>
                                <span className="plan-card-amount">{parseFloat(plan.price).toFixed(0)}</span>
                                <span className="plan-card-period">/{plan.durationDays} días</span>
                            </div>

                            {plan.description && (
                                <p className="plan-card-desc">{plan.description}</p>
                            )}

                            <ul className="plan-card-features">
                                <li className="plan-card-feature">
                                    <Check size={14} />
                                    {plan.maxDevices} dispositivo{plan.maxDevices > 1 ? 's' : ''}
                                </li>
                                {plan.hasHd && (
                                    <li className="plan-card-feature">
                                        <Check size={14} />
                                        Calidad HD
                                    </li>
                                )}
                                {plan.has4k && (
                                    <li className="plan-card-feature">
                                        <Check size={14} />
                                        Calidad 4K Ultra HD
                                    </li>
                                )}
                                {plan.allowDownload && (
                                    <li className="plan-card-feature">
                                        <Check size={14} />
                                        Descarga offline
                                    </li>
                                )}
                                {plan.noAds && (
                                    <li className="plan-card-feature">
                                        <Check size={14} />
                                        Sin anuncios
                                    </li>
                                )}
                            </ul>

                            <button
                                className="plan-card-btn"
                                onClick={() => handleSelectPlan(plan)}
                            >
                                <MessageCircle size={16} />
                                Solicitar Plan
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
