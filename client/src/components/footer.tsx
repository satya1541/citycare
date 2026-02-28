import { Link } from "wouter";
import { Twitter, Facebook, Instagram, Linkedin, Smartphone, Apple, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-zinc-50 text-zinc-800 pt-16 pb-8 border-t border-zinc-200">
            <div className="container mx-auto px-4 max-w-[1260px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mb-12">
                    {/* Brand & Contact */}
                    <div className="lg:col-span-1">

                        <p className="text-sm text-zinc-600 mb-6 leading-relaxed max-w-sm">
                            Your trusted partner for premium home services. We connect you with verified professionals for all your everyday needs.
                        </p>
                        <div className="space-y-3 text-sm text-zinc-600">
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-primary" />
                                <span>+91 63633 53544</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-primary" />
                                <span>contact@citycares.in</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>Bhaskar Parichha Plot No 10, Lane 2, Phase 4 Adarsh Vihar Near Big Bazaar, Patia KIIT P.o Bhubaneswar 751024 Odisha</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-base mb-6 text-zinc-900 uppercase tracking-wider">Company</h4>
                        <ul className="space-y-3 text-sm text-zinc-600 font-medium">
                            <li><Link href="/about" className="hover:text-primary transition-colors cursor-pointer">About Us</Link></li>
                            <li><a href="/policy/TermsAndConditions.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors cursor-pointer">Terms & Conditions</a></li>
                            <li><a href="/policy/PrivecyAndPolicies.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</a></li>
                            <li><a href="/policy/AntiDiscriminationPolicy.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors cursor-pointer">Anti-Discrimination Policy</a></li>
                            <li><a href="/policy/CancellationAndRefundPolicy.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors cursor-pointer">Cancellation & Refund Policy</a></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact Us</Link></li>
                        </ul>
                    </div>



                    {/* Get the App */}
                    <div>
                        <h4 className="font-bold text-base mb-6 text-zinc-900 uppercase tracking-wider">Get the App</h4>
                        <div className="flex flex-col gap-3">
                            <a href="#" className="flex items-center justify-center gap-2 w-full sm:w-44 h-11 bg-zinc-900 text-white rounded-lg hover:bg-primary transition-colors shadow-sm cursor-not-allowed opacity-80" onClick={(e) => e.preventDefault()}>
                                <Apple className="w-5 h-5" />
                                <div className="text-left flex flex-col justify-center">
                                    <span className="text-[10px] leading-none opacity-80">Download on the</span>
                                    <span className="text-sm font-semibold leading-tight mt-0.5">Coming Soon</span>
                                </div>
                            </a>
                            <a href="https://play.google.com/store/apps/details?id=com.citycare&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full sm:w-44 h-11 bg-zinc-900 text-white rounded-lg hover:bg-primary transition-colors shadow-sm">
                                <Smartphone className="w-5 h-5" />
                                <div className="text-left flex flex-col justify-center">
                                    <span className="text-[10px] leading-none opacity-80">GET IT ON</span>
                                    <span className="text-sm font-semibold leading-tight mt-0.5">Google Play</span>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div>
                        <h4 className="font-bold text-base mb-6 text-zinc-900 uppercase tracking-wider">Follow Us</h4>
                        <div className="flex gap-3">
                            <a href="#" className="w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-600 hover:bg-primary hover:text-white hover:border-primary transition-all">
                                <Twitter className="w-4 h-4" fill="currentColor" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-600 hover:bg-primary hover:text-white hover:border-primary transition-all">
                                <Facebook className="w-4 h-4" fill="currentColor" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-600 hover:bg-primary hover:text-white hover:border-primary transition-all">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-600 hover:bg-primary hover:text-white hover:border-primary transition-all">
                                <Linkedin className="w-4 h-4" fill="currentColor" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-zinc-200 text-sm text-zinc-500">
                    <p>© 2026 City Expert Care. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0 font-medium">
                        <a href="/policy/PrivecyAndPolicies.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</a>
                        <a href="/policy/TermsAndConditions.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors cursor-pointer">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
