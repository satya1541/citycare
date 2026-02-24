import { Link } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ShieldCheck, CircleDollarSign, ThumbsUp, ArrowRight } from "lucide-react";

export default function About() {
    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <Header />

            <main className="flex-1 w-full flex flex-col items-center">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#000428] to-[#004e92] text-white py-24 md:py-32 flex justify-center w-full px-4 md:rounded-b-3xl max-w-[1920px] mx-auto shadow-xl z-10">
                    <div className="absolute inset-0 bg-black/20 mix-blend-multiply border-b border-primary/20"></div>
                    {/* Optional abstract patterns */}
                    <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl shadow-inner"></div>
                    <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-3xl"></div>

                    <div className="container max-w-5xl relative z-10 text-center">
                        <span className="inline-block px-5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-50 font-medium text-sm tracking-widest uppercase mb-8 shadow-sm">
                            Our Mission
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight drop-shadow-lg">
                            Elevating the Standard <br className="hidden md:block" /> of Home Care
                        </h1>
                        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed mb-4">
                            Dedicated to excellence, built on trust. Discover our journey in providing premium home services that transform living spaces into sanctuaries.
                        </p>
                    </div>
                </section>

                {/* Why Choose Us - Core Pillars */}
                <section className="py-20 md:py-28 bg-slate-50 relative -mt-8 px-4 w-full flex justify-center z-0">
                    <div className="container max-w-[1260px]">
                        <div className="text-center mb-16">
                            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">The Foundation</h2>
                            <h3 className="text-3xl md:text-4xl font-bold text-zinc-900">Our Core Pillars</h3>
                            <p className="mt-4 text-zinc-600 max-w-2xl mx-auto text-lg">We combine high-tech efficiency with high-touch personal service to ensure your home is in the best hands possible.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Pillar 1 */}
                            <div className="bg-white p-10 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
                                <div className="w-14 h-14 bg-blue-50 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 -rotate-3 group-hover:rotate-0">
                                    <ShieldCheck className="w-7 h-7" />
                                </div>
                                <h4 className="text-xl font-bold text-zinc-900 mb-4">Verified Professionals</h4>
                                <p className="text-zinc-600 leading-relaxed">
                                    Every professional undergoes a rigorous 10-point background check and skill assessment. Only the top 5% of applicants make the cut.
                                </p>
                            </div>

                            {/* Pillar 2 */}
                            <div className="bg-white p-10 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300 group">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 -rotate-3 group-hover:rotate-0">
                                    <CircleDollarSign className="w-7 h-7" />
                                </div>
                                <h4 className="text-xl font-bold text-zinc-900 mb-4">Transparent Pricing</h4>
                                <p className="text-zinc-600 leading-relaxed">
                                    No hidden fees or unexpected surcharges. Our upfront quote system ensures you know exactly what you're paying for before we start.
                                </p>
                            </div>

                            {/* Pillar 3 */}
                            <div className="bg-white p-10 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-xl hover:border-amber-500/20 transition-all duration-300 group">
                                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 -rotate-3 group-hover:rotate-0">
                                    <ThumbsUp className="w-7 h-7" />
                                </div>
                                <h4 className="text-xl font-bold text-zinc-900 mb-4">Satisfaction Guarantee</h4>
                                <p className="text-zinc-600 leading-relaxed">
                                    We don't just finish the job; we ensure you're delighted. If you're not 100% satisfied, we'll make it right at no extra cost to you.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Story / Timeline */}
                <section className="py-20 md:py-28 bg-white px-4 flex justify-center w-full shadow-sm border-y border-zinc-100 relative z-10">
                    <div className="container max-w-[1000px]">
                        <div className="text-center mb-16 md:mb-24">
                            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">The Journey</h2>
                            <h3 className="text-3xl md:text-4xl font-bold text-zinc-900">From a Vision to a Community Movement</h3>
                            <p className="mt-4 text-zinc-600 max-w-2xl mx-auto text-lg">Founded in 2018, we started with a simple goal: to make premium home care accessible and reliable for every busy professional.</p>
                        </div>

                        <div className="relative border-l-2 border-slate-100 ml-4 md:ml-0 md:border-l-0 md:space-y-0 space-y-12">
                            {/* Central Line for Desktop */}
                            <div className="hidden md:block absolute top-[24px] bottom-0 left-1/2 -ml-px w-[2px] bg-slate-100"></div>

                            {/* Milestone 1 */}
                            <div className="relative flex items-center md:items-start md:justify-between w-full group">
                                <div className="hidden md:block w-[45%] text-right pr-12 pt-1 transition-all duration-300 group-hover:-translate-x-2">
                                    <div className="inline-block px-4 py-1.5 bg-zinc-50 border border-zinc-200 text-zinc-600 font-bold rounded-full text-sm mb-4">2018</div>
                                    <h4 className="text-2xl font-bold text-zinc-900 mb-3">The Vision Begins</h4>
                                    <p className="text-zinc-600 leading-relaxed">Our founder recognized the gap in high-end, reliable home maintenance. Started with a team of 3 experts in a small office in downtown.</p>
                                </div>
                                {/* Mobile left side */}
                                <div className="md:hidden absolute w-4 h-4 rounded-full bg-primary border-4 border-blue-50 left-[-9px] top-6 shadow-sm"></div>
                                <div className="md:hidden pl-8 w-full">
                                    <div className="inline-block px-3 py-1 bg-zinc-100 text-zinc-600 font-bold rounded-md text-sm mb-3">2018</div>
                                    <h4 className="text-xl font-bold text-zinc-900 mb-2">The Vision Begins</h4>
                                    <p className="text-zinc-600">Our founder recognized the gap in high-end, reliable home maintenance. Started with a team of 3 experts in a small office in downtown.</p>
                                </div>
                                {/* Desktop center dot */}
                                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border border-slate-200 items-center justify-center shadow-lg z-10 pt-2 top-0 mt-[6px] group-hover:border-primary transition-colors duration-300">
                                    <div className="w-3.5 h-3.5 rounded-full bg-primary mb-2 group-hover:scale-125 transition-transform duration-300"></div>
                                </div>
                                <div className="hidden md:block w-[45%] pl-12"></div>
                            </div>

                            {/* Milestone 2 */}
                            <div className="relative flex items-center md:items-start md:justify-between w-full md:mt-24 group">
                                <div className="hidden md:block w-[45%] pr-12"></div>
                                {/* Desktop center dot */}
                                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border border-slate-200 items-center justify-center shadow-lg z-10 pt-2 top-0 mt-[6px] group-hover:border-primary transition-colors duration-300">
                                    <div className="w-3.5 h-3.5 rounded-full bg-primary mb-2 group-hover:scale-125 transition-transform duration-300"></div>
                                </div>
                                <div className="hidden md:block w-[45%] text-left pl-12 pt-1 transition-all duration-300 group-hover:translate-x-2">
                                    <div className="inline-block px-4 py-1.5 bg-zinc-50 border border-zinc-200 text-zinc-600 font-bold rounded-full text-sm mb-4">2020</div>
                                    <h4 className="text-2xl font-bold text-zinc-900 mb-3">Scaling the Trust</h4>
                                    <p className="text-zinc-600 leading-relaxed">Launched our proprietary vetting app, allowing us to scale while maintaining strict quality controls. Expanded to our first 5 major city hubs.</p>
                                </div>

                                {/* Mobile left side */}
                                <div className="md:hidden absolute w-4 h-4 rounded-full bg-primary border-4 border-blue-50 left-[-9px] top-6 shadow-sm"></div>
                                <div className="md:hidden pl-8 w-full">
                                    <div className="inline-block px-3 py-1 bg-zinc-100 text-zinc-600 font-bold rounded-md text-sm mb-3">2020</div>
                                    <h4 className="text-xl font-bold text-zinc-900 mb-2">Scaling the Trust</h4>
                                    <p className="text-zinc-600">Launched our proprietary vetting app, allowing us to scale while maintaining strict quality controls. Expanded to our first 5 major city hubs.</p>
                                </div>
                            </div>

                            {/* Milestone 3 */}
                            <div className="relative flex items-center md:items-start md:justify-between w-full md:mt-24 group">
                                <div className="hidden md:block w-[45%] text-right pr-12 pt-1 transition-all duration-300 group-hover:-translate-x-2">
                                    <div className="inline-block px-4 py-1.5 bg-zinc-50 border border-zinc-200 text-zinc-600 font-bold rounded-full text-sm mb-4">2022</div>
                                    <h4 className="text-2xl font-bold text-zinc-900 mb-3">Sustainable Care</h4>
                                    <p className="text-zinc-600 leading-relaxed">Introduced eco-friendly service lines and reached the milestone of 50,000 successful home service completions.</p>
                                </div>
                                {/* Desktop center dot */}
                                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border border-slate-200 items-center justify-center shadow-lg z-10 pt-2 top-0 mt-[6px] group-hover:border-primary transition-colors duration-300">
                                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 mb-2 group-hover:scale-125 transition-transform duration-300"></div>
                                </div>
                                <div className="hidden md:block w-[45%] pl-12"></div>

                                {/* Mobile left side */}
                                <div className="md:hidden absolute w-4 h-4 rounded-full bg-emerald-500 border-4 border-emerald-50 left-[-9px] top-6 shadow-sm"></div>
                                <div className="md:hidden pl-8 w-full">
                                    <div className="inline-block px-3 py-1 bg-zinc-100 text-zinc-600 font-bold rounded-md text-sm mb-3">2022</div>
                                    <h4 className="text-xl font-bold text-zinc-900 mb-2">Sustainable Care</h4>
                                    <p className="text-zinc-600">Introduced eco-friendly service lines and reached the milestone of 50,000 successful home service completions.</p>
                                </div>
                            </div>

                            {/* Milestone 4 */}
                            <div className="relative flex items-center md:items-start md:justify-between w-full md:mt-24 group">
                                <div className="hidden md:block w-[45%] pr-12"></div>
                                {/* Desktop center dot */}
                                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border border-slate-200 items-center justify-center shadow-lg z-10 pt-2 top-0 mt-[6px] group-hover:border-primary transition-colors duration-300">
                                    <div className="w-3.5 h-3.5 rounded-full bg-primary mb-2 group-hover:scale-125 transition-transform animate-pulse duration-300"></div>
                                </div>
                                <div className="hidden md:block w-[45%] text-left pl-12 pt-1 transition-all duration-300 group-hover:translate-x-2">
                                    <div className="inline-block px-4 py-1.5 bg-blue-50 border border-primary/20 text-primary font-bold rounded-full text-sm mb-4">Present</div>
                                    <h4 className="text-2xl font-bold text-zinc-900 mb-3">Expanding the Horizon</h4>
                                    <p className="text-zinc-600 leading-relaxed">Now serving over 20 regions with a network of 500+ verified professionals, continuing to redefine what home care means.</p>
                                </div>

                                {/* Mobile left side */}
                                <div className="md:hidden absolute w-4 h-4 rounded-full bg-primary border-4 border-blue-50 left-[-9px] top-6 shadow-sm animate-pulse"></div>
                                <div className="md:hidden pl-8 w-full">
                                    <div className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold rounded-md text-sm mb-3">Present</div>
                                    <h4 className="text-xl font-bold text-zinc-900 mb-2">Expanding the Horizon</h4>
                                    <p className="text-zinc-600">Now serving over 20 regions with a network of 500+ verified professionals, continuing to redefine what home care means.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 
                <section className="py-20 md:py-28 bg-[#f8fafc] flex justify-center px-4 w-full relative">
                    <div className="container max-w-[1260px]">
                        <div className="text-center mb-16 md:mb-20">
                            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Our Leadership</h2>
                            <h3 className="text-3xl md:text-4xl font-bold text-zinc-900">Meet the Experts Behind the Care</h3>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-5xl mx-auto">
                            <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                                <div className="aspect-[4/3] w-full bg-zinc-200 relative overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800" alt="Marcus Thorne" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>
                                <div className="p-8 text-center bg-white relative z-10 -mt-8 mx-5 rounded-xl shadow-lg border border-zinc-50 transition-all duration-300">
                                    <h4 className="text-xl font-bold text-zinc-900 mb-1">Marcus Thorne</h4>
                                    <p className="text-primary font-medium text-sm mb-4 tracking-wide uppercase">Founder & CEO</p>
                                    <p className="text-zinc-600 text-sm leading-relaxed">A hospitality veteran with 20 years of experience in luxury estate management.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                                <div className="aspect-[4/3] w-full bg-zinc-200 relative overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" alt="Elena Rodriguez" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>
                                <div className="p-8 text-center bg-white relative z-10 -mt-8 mx-5 rounded-xl shadow-lg border border-zinc-50 transition-all duration-300">
                                    <h4 className="text-xl font-bold text-zinc-900 mb-1">Elena Rodriguez</h4>
                                    <p className="text-primary font-medium text-sm mb-4 tracking-wide uppercase">Chief Operations</p>
                                    <p className="text-zinc-600 text-sm leading-relaxed">Specializing in logistics and tech-driven efficiency across our service networks.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group sm:col-span-2 lg:col-span-1 sm:max-w-md sm:mx-auto lg:max-w-none w-full">
                                <div className="aspect-[4/3] w-full bg-zinc-200 relative overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800" alt="David Chen" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>
                                <div className="p-8 text-center bg-white relative z-10 -mt-8 mx-5 rounded-xl shadow-lg border border-zinc-50 transition-all duration-300">
                                    <h4 className="text-xl font-bold text-zinc-900 mb-1">David Chen</h4>
                                    <p className="text-primary font-medium text-sm mb-4 tracking-wide uppercase">Head of Quality</p>
                                    <p className="text-zinc-600 text-sm leading-relaxed">Ensuring every professional meets the City Care "Platinum Standard" of service.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                */}


                {/* CTA Section */}
                <section className="py-24 bg-primary text-white text-center px-4 w-full flex justify-center relative overflow-hidden">
                    {/* Background elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4 pointer-events-none"></div>

                    <div className="container max-w-3xl relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight drop-shadow-sm">Ready to Experience Premium Care?</h2>
                        <p className="text-blue-50 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                            Join the thousands of homeowners who trust us with their sanctuary. Get your first professional assessment today.
                        </p>
                        <Link href="/">
                            <button className="bg-white text-primary hover:bg-zinc-50 inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 text-lg group">
                                Book a Service Now
                                <ArrowRight className="w-5 h-5 -mt-0.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
