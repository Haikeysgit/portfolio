'use client';

const projects = [
    {
        id: 'PRJ-01',
        title: 'Nova Platform',
        category: 'High-Frequency Trading',
        stack: 'Next.js / Rust / WebSockets',
        year: '2025',
        link: '#'
    },
    {
        id: 'PRJ-02',
        title: 'Nexus Graph Engine',
        category: 'Distributed Analytics',
        stack: 'React / D3.js / Go',
        year: '2024',
        link: '#'
    },
    {
        id: 'PRJ-03',
        title: 'Aether Cloud',
        category: 'Edge Compute Resource',
        stack: 'Node.js / Kubernetes / AWS',
        year: '2023',
        link: '#'
    }
];

export const SelectedWorks = () => {
    return (
        <section id="work" className="py-24 px-6 max-w-7xl mx-auto border-t border-surfaceBorder">
            <div className="flex justify-between items-end mb-12">
                <h2 className="text-3xl font-semibold tracking-tight text-primaryText">Selected Works</h2>
                <div className="text-sm font-mono text-secondaryText text-right">01 / PROJECTS</div>
            </div>

            <div className="w-full border-t border-surfaceBorder">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 py-4 border-b border-surfaceBorder text-xs font-mono text-secondaryText uppercase tracking-wider">
                    <div className="col-span-1">ID</div>
                    <div className="col-span-4">Project</div>
                    <div className="col-span-3">Category</div>
                    <div className="col-span-3">Core Stack</div>
                    <div className="col-span-1 text-right">Year</div>
                </div>

                {/* Table Rows */}
                <div className="flex flex-col">
                    {projects.map((project) => (
                        <a
                            key={project.id}
                            href={project.link}
                            className="group block grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 py-6 border-b border-surfaceBorder hover:bg-surface transition-colors duration-150 relative"
                        >
                            <div className="md:col-span-1 font-mono text-xs text-secondaryText flex items-center">{project.id}</div>
                            <div className="md:col-span-4 text-xl font-medium text-primaryText group-hover:text-blue-400 transition-colors duration-150 pr-4">{project.title}</div>
                            <div className="md:col-span-3 text-sm text-secondaryText flex items-center">{project.category}</div>
                            <div className="md:col-span-3 font-mono text-xs text-secondaryText flex items-center">{project.stack}</div>
                            <div className="md:col-span-1 font-mono text-xs text-secondaryText flex justify-start md:justify-end items-center">{project.year}</div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};
