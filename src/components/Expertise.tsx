'use client';

const competencies = [
    {
        domain: 'Frontend Architecture',
        desc: 'Building highly optimized, accessible, and type-safe user interfaces.',
        skills: ['React / Next.js', 'TypeScript', 'Tailwind CSS', 'Redux / Zustand', 'Web Vitals Optimization']
    },
    {
        domain: 'Backend & Distributed Systems',
        desc: 'Designing fault-tolerant microservices and high-throughput APIs.',
        skills: ['Node.js', 'Go', 'gRPC / GraphQL', 'PostgreSQL / Redis / Kafka', 'System Design']
    },
    {
        domain: 'Infrastructure & DevOps',
        desc: 'Automating deployments and managing scalable cloud resources.',
        skills: ['AWS (EC2, S3, RDS)', 'Docker / Kubernetes', 'Terraform', 'CI/CD Pipelines']
    }
];

export const Expertise = () => {
    return (
        <section id="expertise" className="py-24 px-6 max-w-7xl mx-auto border-t border-surfaceBorder">
            <div className="flex justify-between items-end mb-12">
                <h2 className="text-3xl font-semibold tracking-tight text-primaryText">Technical Expertise</h2>
                <div className="text-sm font-mono text-secondaryText text-right">02 / COMPETENCIES</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {competencies.map((comp, idx) => (
                    <div key={idx} className="flex flex-col">
                        <h3 className="text-lg font-medium text-primaryText mb-3 border-b border-surfaceBorder pb-3">
                            {comp.domain}
                        </h3>
                        <p className="text-sm text-secondaryText mb-6 leading-relaxed">
                            {comp.desc}
                        </p>
                        <ul className="flex flex-col gap-2">
                            {comp.skills.map((skill, sIdx) => (
                                <li key={sIdx} className="font-mono text-xs text-neutral-300">
                                    <span className="text-secondaryText mr-2">-</span>{skill}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
};
