'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    items: FAQItem[];
}

export default function FAQSection({ items }: FAQSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    if (items.length === 0) return null;

    return (
        <section className="faq-section" id="faq-section">
            <div className="section-header section-header--center">
                <div className="faq-icon-wrap">
                    <HelpCircle size={24} />
                </div>
                <h2 className="section-title section-title--large">
                    Preguntas <span className="section-title-accent">Frecuentes</span>
                </h2>
                <p className="section-subtitle">
                    Todo lo que necesitas saber sobre Nuba
                </p>
            </div>

            <div className="faq-list">
                {items.map((item, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <motion.div
                            key={index}
                            className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-30px' }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                        >
                            <button
                                className="faq-question"
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                aria-expanded={isOpen}
                            >
                                <span className="faq-question-text">{item.question}</span>
                                <ChevronDown
                                    size={20}
                                    className={`faq-chevron ${isOpen ? 'faq-chevron--open' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        className="faq-answer-wrap"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    >
                                        <p className="faq-answer">{item.answer}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
