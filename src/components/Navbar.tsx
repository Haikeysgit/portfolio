'use client';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-surfaceBorder z-50">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                <div className="font-mono text-sm tracking-tight font-medium">
                    JOHN_DOE <span className="text-secondaryText ml-2">// PLATFORM ENG</span>
                </div>

                <div className="flex gap-6 text-sm font-medium">
                    {['WORK', 'EXPERTISE', 'CONTACT'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-secondaryText hover:text-primaryText transition-colors duration-150"
                        >
                            {item}
                        </a>
                    ))}
                </div>
            </div>
        </nav>
    );
};
