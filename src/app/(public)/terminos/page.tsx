import Footer from '@/components/layout/Footer';
import { Scale, FileText, Tv, CreditCard, Globe, Users, ShieldAlert } from 'lucide-react';

export default function TerminosPage() {
    return (
        <>
            <div className="!relative !min-h-screen !bg-[#02040A] !text-white !pt-28 md:!pt-40 !pb-16 md:!pb-32 !px-4 sm:!px-8 !overflow-hidden">
                {/* Cinematic Background Effects */}
                <div className="!absolute !inset-0 !z-0 !pointer-events-none">
                    <div className="!absolute !top-[-10%] !left-[20%] !w-[60vw] !h-[60vh] !bg-[var(--color-primary)] !opacity-[0.07] !blur-[150px] !rounded-full"></div>
                    <div className="!absolute !bottom-[-20%] !right-[-10%] !w-[50vw] !h-[50vh] !bg-blue-600 !opacity-[0.04] !blur-[150px] !rounded-full"></div>
                    <div className="!absolute !inset-0 !bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjU2IDI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiLz48L3N2Zz4=')] !opacity-[0.02]"></div>
                </div>

                <div className="!relative !z-10 !max-w-4xl !mx-auto">
                    {/* Header */}
                    <div className="!text-center !mb-20">
                        <div className="!inline-flex !items-center !justify-center !p-5 !bg-white/5 !border !border-white/10 !rounded-3xl !mb-8 !shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                            <Scale size={48} className="!text-[var(--color-primary)]" />
                        </div>
                        <h1 className="!text-4xl sm:!text-5xl md:!text-7xl !font-black !mb-6 !uppercase !tracking-tighter !text-transparent !bg-clip-text !bg-gradient-to-br !from-white !to-gray-500">
                            Términos y Condiciones
                        </h1>
                        <p className="!text-lg md:!text-xl !text-gray-400 !font-medium !max-w-2xl !mx-auto !leading-relaxed">
                            Reglas claras para una experiencia de entretenimiento premium. Por favor lee detenidamente antes de usar la plataforma.
                        </p>
                    </div>
                    
                    <div className="!space-y-6">
                        {/* Section 1 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-[var(--color-primary)]/10 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-white/5 !rounded-2xl group-hover:!bg-[var(--color-primary)]/10 !transition-colors !shrink-0">
                                    <FileText size={28} className="!text-gray-400 group-hover:!text-[var(--color-primary)] !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">1. Aceptación de los Términos</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base">Al acceder y utilizar nuestra plataforma de streaming, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios. Nos reservamos el derecho de actualizar estos términos en cualquier momento.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-[var(--color-primary)]/10 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-white/5 !rounded-2xl group-hover:!bg-[var(--color-primary)]/10 !transition-colors !shrink-0">
                                    <Tv size={28} className="!text-gray-400 group-hover:!text-[var(--color-primary)] !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">2. Servicio de Suscripción</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base !mb-3">Nuestra plataforma ofrece un servicio de suscripción personalizada que permite a nuestros miembros acceder a películas, series, documentales y contenido de entretenimiento ("Contenido") transmitido a través de internet hacia televisores, computadoras, dispositivos móviles y otros dispositivos conectados a internet.</p>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base">El acceso al contenido está sujeto a la adquisición de tiempo de suscripción válido a través de nuestros canales oficiales o vendedores (resellers) autorizados.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-[var(--color-primary)]/10 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-white/5 !rounded-2xl group-hover:!bg-[var(--color-primary)]/10 !transition-colors !shrink-0">
                                    <CreditCard size={28} className="!text-gray-400 group-hover:!text-[var(--color-primary)] !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">3. Facturación y Reembolsos</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base">Su suscripción continuará hasta que se agote su tiempo adquirido o usted decida cancelarla. Los pagos no son reembolsables y no se otorgarán reembolsos ni créditos por períodos de suscripción utilizados parcialmente. En caso de fallas técnicas comprobables del lado del servidor que impidan el disfrute total del servicio, el equipo de soporte evaluará compensaciones de tiempo.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-[var(--color-primary)]/10 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-white/5 !rounded-2xl group-hover:!bg-[var(--color-primary)]/10 !transition-colors !shrink-0">
                                    <Globe size={28} className="!text-gray-400 group-hover:!text-[var(--color-primary)] !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">4. Disponibilidad de Contenido</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base">El Contenido disponible variará según la región geográfica y cambiará periódicamente. La calidad de visualización (HD, Full HD, 4K) puede variar según el dispositivo y puede verse afectada por una variedad de factores, como su ubicación, el ancho de banda y la velocidad de su conexión a internet.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 5 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-red-500/10 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-red-500/10 !rounded-2xl group-hover:!bg-red-500/20 !transition-colors !shrink-0">
                                    <Users size={28} className="!text-red-400 group-hover:!text-red-500 !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">5. Límites de Cuenta y Dispositivos</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base">El número de dispositivos en los que puede ver simultáneamente el contenido depende de su plan de suscripción elegido (ej. Plan 1 Pantalla, Plan 3 Pantallas). <strong className="!text-white">Nos reservamos el derecho de rescindir o suspender el uso del servicio inmediatamente y sin reembolso</strong> previo en caso de que detectemos comportamientos de uso compartido masivo de cuentas que violen nuestras políticas.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 6 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-[var(--color-primary)]/10 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-white/5 !rounded-2xl group-hover:!bg-[var(--color-primary)]/10 !transition-colors !shrink-0">
                                    <ShieldAlert size={28} className="!text-gray-400 group-hover:!text-[var(--color-primary)] !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">6. Propiedad Intelectual</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base">El diseño de la plataforma, interfaces de usuario, funcionalidades y software son propiedad exclusiva de la plataforma. La reproducción no autorizada de nuestra tecnología o el intento de extraer el contenido multimedia mediante herramientas externas resultará en el baneo permanente de la cuenta y posibles acciones legales.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
