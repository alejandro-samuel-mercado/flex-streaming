import Footer from '@/components/layout/Footer';
import { ShieldCheck, Database, Eye, Share2, Lock, UserCog } from 'lucide-react';

export default function PrivacidadPage() {
    return (
        <>
            <div className="!relative !min-h-screen !bg-[#02040A] !text-white !pt-28 md:!pt-40 !pb-16 md:!pb-32 !px-4 sm:!px-8 !overflow-hidden">
                {/* Cinematic Background Effects */}
                <div className="!absolute !inset-0 !z-0 !pointer-events-none">
                    <div className="!absolute !top-[-10%] !right-[10%] !w-[60vw] !h-[60vh] !bg-green-500 !opacity-[0.05] !blur-[150px] !rounded-full"></div>
                    <div className="!absolute !bottom-[-20%] !left-[-10%] !w-[50vw] !h-[50vh] !bg-cyan-600 !opacity-[0.05] !blur-[150px] !rounded-full"></div>
                    <div className="!absolute !inset-0 !bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjU2IDI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiLz48L3N2Zz4=')] !opacity-[0.02]"></div>
                </div>

                <div className="!relative !z-10 !max-w-4xl !mx-auto">
                    {/* Header */}
                    <div className="!text-center !mb-20">
                        <div className="!inline-flex !items-center !justify-center !p-5 !bg-white/5 !border !border-white/10 !rounded-3xl !mb-8 !shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                            <ShieldCheck size={48} className="!text-green-400" />
                        </div>
                        <h1 className="!text-4xl sm:!text-5xl md:!text-7xl !font-black !mb-6 !uppercase !tracking-tighter !text-transparent !bg-clip-text !bg-gradient-to-br !from-white !to-gray-500">
                            Política de Privacidad
                        </h1>
                        <p className="!text-lg md:!text-xl !text-gray-400 !font-medium !max-w-2xl !mx-auto !leading-relaxed">
                            Nos tomamos muy en serio la seguridad de tu información. Descubre cómo manejamos y protegemos tus datos personales.
                        </p>
                    </div>
                    
                    <div className="!space-y-6">
                        {/* Section 1 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-green-500/5 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-white/5 !rounded-2xl group-hover:!bg-green-500/10 !transition-colors !shrink-0">
                                    <Database size={28} className="!text-gray-400 group-hover:!text-green-400 !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">1. Recopilación de Información</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base">Recopilamos la información que usted nos proporciona al momento del registro, que incluye su nombre, nombre de usuario, dirección de correo electrónico, número de teléfono (si aplica) y detalles de autenticación. Además, el sistema recopila automáticamente información sobre el uso que hace de nuestro servicio, como su historial de reproducción, búsquedas de títulos, duración de visualización de los videos, porcentaje de progreso y su interacción con nuestra plataforma para ofrecerle la funcionalidad de "Continuar viendo".</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-green-500/5 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-white/5 !rounded-2xl group-hover:!bg-green-500/10 !transition-colors !shrink-0">
                                    <Eye size={28} className="!text-gray-400 group-hover:!text-green-400 !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">2. Uso de la Información</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base !mb-4">Utilizamos la información recopilada para proporcionar, analizar, administrar y mejorar nuestros servicios, lo que incluye:</p>
                                    <ul className="!list-disc !ml-6 !space-y-2 !text-sm md:!text-base !text-gray-400">
                                        <li>Brindarle recomendaciones altamente personalizadas de películas y series.</li>
                                        <li>Gestionar las sesiones activas en sus distintos dispositivos.</li>
                                        <li>Comunicarnos con usted en relación a actualizaciones de cuenta.</li>
                                        <li>Detectar, prevenir o investigar actividades que puedan violar nuestras políticas.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-green-500/5 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-white/5 !rounded-2xl group-hover:!bg-green-500/10 !transition-colors !shrink-0">
                                    <Share2 size={28} className="!text-gray-400 group-hover:!text-green-400 !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">3. Compartición de Datos y Vendedores</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base">No vendemos sus datos personales a terceros de publicidad. Sin embargo, si su cuenta fue creada u obtenida a través de un Vendedor Autorizado (Reseller), dicho Vendedor tiene acceso a su estado de suscripción, tiempo de vencimiento y algunos datos de contacto estrictamente para propósitos de gestión de cobranza y renovación. <strong className="!text-white">El Vendedor no tiene acceso a sus contraseñas ni a su historial de visualización detallado.</strong></p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-green-500/5 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-white/5 !rounded-2xl group-hover:!bg-green-500/10 !transition-colors !shrink-0">
                                    <Lock size={28} className="!text-gray-400 group-hover:!text-green-400 !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">4. Seguridad</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base">Utilizamos medidas administrativas, lógicas, físicas y de cifrado para proteger su información personal (como el hasheo de contraseñas mediante algoritmos seguros) contra pérdida, robo y acceso, uso y modificación no autorizados. Aunque garantizamos la mayor seguridad en nuestros servidores, es responsabilidad exclusiva del usuario mantener en privado sus credenciales.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 5 */}
                        <div className="!group !relative !bg-[#0A0F24]/60 !backdrop-blur-2xl !border !border-white/5 hover:!border-white/10 !rounded-3xl !p-8 md:!p-10 !transition-all !duration-500 hover:!shadow-2xl hover:!shadow-green-500/5 hover:!-translate-y-1">
                            <div className="!flex !flex-col sm:!flex-row !items-start !gap-6">
                                <div className="!p-4 !bg-white/5 !rounded-2xl group-hover:!bg-green-500/10 !transition-colors !shrink-0">
                                    <UserCog size={28} className="!text-gray-400 group-hover:!text-green-400 !transition-colors" />
                                </div>
                                <div>
                                    <h2 className="!text-2xl !font-black !text-white !mb-3 !tracking-wide">5. Sus Derechos sobre los Datos</h2>
                                    <p className="!text-gray-400 !leading-relaxed !text-sm md:!text-base">Usted puede solicitar acceso a su información personal, corregirla o actualizarla desde la página de Mi Perfil. También tiene derecho a solicitar la eliminación permanente de su cuenta y de todo su historial de visualización contactando directamente a nuestro equipo de soporte. Tenga en cuenta que esto ocasionará la pérdida irremediable de su tiempo de suscripción restante.</p>
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
