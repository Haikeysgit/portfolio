'use client';

export const Contact = () => {
    return (
        <section id="contact" className="py-32 px-6 max-w-7xl mx-auto border-t border-surfaceBorder">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-4xl font-semibold tracking-tight text-primaryText mb-6">
                        Initiate Contact.
                    </h2>
                    <p className="text-secondaryText max-w-md text-lg font-light">
                        Available for new opportunities and consulting on distributed systems architecture.
                    </p>
                </div>

                <div className="flex flex-col gap-6 md:items-end justify-center font-mono">
                    <a
                        href="mailto:engineering@johndoe.dev"
                        className="text-xl md:text-2xl text-primaryText hover:text-blue-400 transition-colors duration-150 border-b border-surfaceBorder hover:border-blue-400 pb-1 w-fit"
                    >
                        engineering@johndoe.dev
                    </a>

                    <div className="flex gap-8 mt-4">
                        {['GITHUB', 'LINKEDIN', 'TWITTER'].map((handle) => (
                            <a
                                key={handle}
                                href="#"
                                className="text-sm text-secondaryText hover:text-primaryText transition-colors duration-150"
                            >
                // {handle}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
