import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Phone, Mail, MapPin, Send, MessageSquare, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function Contact() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <Header />

            <main className="flex-1 w-full flex flex-col items-center">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#000428] to-[#004e92] text-white py-20 md:py-28 flex justify-center w-full px-4 md:rounded-b-3xl max-w-[1920px] mx-auto shadow-xl z-10">
                    <div className="absolute inset-0 bg-black/10 mix-blend-multiply border-b border-primary/20"></div>
                    <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl shadow-inner"></div>

                    <div className="container max-w-5xl relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-block px-5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-50 font-medium text-sm tracking-widest uppercase mb-6 shadow-sm">
                                Contact Us
                            </span>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight drop-shadow-lg">
                                We're Here to Help
                            </h1>
                            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                                Have questions about our services or need assistance with a booking? Our dedicated support team is ready to provide you with the answers you need.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Contact Content */}
                <section className="py-16 md:py-24 px-4 w-full flex justify-center relative -mt-10 z-20">
                    <div className="container max-w-[1200px]">
                        <div className="grid lg:grid-cols-12 gap-12">

                            {/* Left Side: Contact Info */}
                            <div className="lg:col-span-5 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-3xl font-bold text-zinc-900">Get in Touch</h2>
                                    <p className="text-zinc-600 text-lg leading-relaxed">
                                        Reach out to us through any of these channels. We aim to respond to all inquiries within 24 hours.
                                    </p>

                                    <div className="space-y-6 pt-4">
                                        {/* Phone */}
                                        <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow group">
                                            <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                <Phone className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Phone</p>
                                                <p className="text-xl font-bold text-zinc-900">+91 63633 53544</p>
                                                <p className="text-sm text-zinc-500 mt-1">Mon-Sat, 9AM - 8PM</p>
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow group">
                                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                <Mail className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Email</p>
                                                <p className="text-xl font-bold text-zinc-900">contact@citycares.in</p>
                                                <p className="text-sm text-zinc-500 mt-1">We'll get back to you shortly</p>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow group">
                                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                <MapPin className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Office Location</p>
                                                <p className="text-base font-bold text-zinc-900 leading-snug">
                                                    Bhaskar Parichha Plot No 10, Lane 2, Phase 4 Adarsh Vihar Near Big Bazaar, Patia KIIT P.o Bhubaneswar 751024 Odisha
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Social Links placeholder */}
                                    <div className="pt-6">
                                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4">Connect with us</h3>
                                        <div className="flex gap-3">
                                            {[Globe, MessageSquare].map((Icon, i) => (
                                                <div key={i} className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary transition-colors cursor-pointer">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Right Side: Form */}
                            <div className="lg:col-span-7">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-zinc-100 relative overflow-hidden"
                                >
                                    {/* Abstract background for form */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                                    {submitted ? (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Send className="w-10 h-10" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-zinc-900 mb-4">Message Sent!</h2>
                                            <p className="text-zinc-600 text-lg mb-8">
                                                Thank you for reaching out. We've received your inquiry and will be in touch with you very soon.
                                            </p>
                                            <Button
                                                onClick={() => setSubmitted(false)}
                                                className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-xl"
                                            >
                                                Send Another Message
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Send a Message</h2>
                                            <p className="text-zinc-500 mb-10">Fill out the form below and we'll get back to you as soon as possible.</p>

                                            <form onSubmit={handleSubmit} className="space-y-6">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="name" className="text-sm font-bold text-zinc-700">Full Name</Label>
                                                        <Input id="name" placeholder="John Doe" required className="rounded-xl border-zinc-200 focus:ring-primary h-12 bg-zinc-50/50" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="email" className="text-sm font-bold text-zinc-700">Email Address</Label>
                                                        <Input id="email" type="email" placeholder="john@example.com" required className="rounded-xl border-zinc-200 focus:ring-primary h-12 bg-zinc-50/50" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="subject" className="text-sm font-bold text-zinc-700">Subject</Label>
                                                    <Input id="subject" placeholder="How can we help you?" required className="rounded-xl border-zinc-200 focus:ring-primary h-12 bg-zinc-50/50" />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="message" className="text-sm font-bold text-zinc-700">Message</Label>
                                                    <Textarea id="message" placeholder="Type your message here..." required className="min-h-[150px] rounded-xl border-zinc-200 focus:ring-primary bg-zinc-50/50 p-4" />
                                                </div>

                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                                                >
                                                    {isSubmitting ? "Sending..." : "Send Message"}
                                                </Button>
                                            </form>
                                        </>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ or Help Center CTA */}
                <section className="py-12 md:py-20 w-full flex justify-center bg-zinc-900 text-white overflow-hidden relative">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        {/* Optional grid pattern */}
                    </div>
                    <div className="container max-w-4xl text-center relative z-10 px-4">
                        <Clock className="w-12 h-12 text-primary mx-auto mb-6" />
                        <h2 className="text-2xl md:text-4xl font-bold mb-6">Need Immediate Assistance?</h2>
                        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                            Check our Help Center for quick answers to common questions about bookings, cancellations, and service quality.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button className="bg-white text-zinc-900 hover:bg-zinc-100 px-8 h-12 rounded-xl font-bold">
                                Visit Help Center
                            </Button>
                            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 h-12 rounded-xl font-bold">
                                Chat With Us
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
