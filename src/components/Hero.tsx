'use client';

export const Hero = () => {
    return (
        <section className="min-h-[85vh] flex flex-col justify-end pb-24 px-6 max-w-7xl mx-auto pt-32">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-8 flex flex-col gap-6">
                    <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.1] text-primaryText">
                        Systems Architecture &<br />
                        Fullstack Engineering.
                    </h1>
                    <p className="text-xl md:text-2xl font-light text-secondaryText max-w-2xl leading-relaxed">
                        I build highly fault-tolerant, low-latency infrastructure and precise, performant user interfaces for demanding environments.
                    </p>
                </div>

                <div className="md:col-span-4 flex flex-col md:items-end md:pb-2">
                    <a
                        href="#work"
                        className="inline-flex items-center justify-center h-12 px-6 bg-primaryText text-black font-medium hover:bg-neutral-300 transition-colors duration-150 w-full md:w-auto"
                    >
                        Review Operations
                        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </a>
                </div>
            </div>

            <div className="mt-20 border-t border-surfaceBorder pt-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm font-mono text-secondaryText">
                <div>
                    <div className="text-primaryText mb-1">CURRENT STATUS</div>
                    <div>AVAILABLE FOR HIRE</div>
                </div>
                <div>
                    <div className="text-primaryText mb-1">LOCATION</div>
                    <div>SAN FRANCISCO, CA</div>
                </div>
                <div>
                    <div className="text-primaryText mb-1">FOCUS</div>
                    <div>DISTRIBUTED SYSTEMS</div>
                </div>
                <div>
                    <div className="text-primaryText mb-1">EXPERIENCE</div>
                    <div>08 YEARS</div>
                </div>
            </div>
        </section>
    );
};
