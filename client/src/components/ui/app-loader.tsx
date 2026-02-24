import logo from "@/assets/logo_loader.png";

export function AppLoader() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-50">
            <div className="text-center">
                <img src={logo} alt="City Cares Logo" className="w-[100px] mb-6 mx-auto" />
                <div className="w-[140px] h-[3px] bg-[#ddd] rounded-[10px] overflow-hidden relative mx-auto">
                    <div className="absolute top-0 h-full w-[40px] bg-[#6d28d9] rounded-[10px] animate-[slide_1s_linear_infinite]"></div>
                </div>
            </div>
            <style>{`
        @keyframes slide {
          0% { left: -40px; }
          100% { left: 100%; }
        }
      `}</style>
        </div>
    );
}
