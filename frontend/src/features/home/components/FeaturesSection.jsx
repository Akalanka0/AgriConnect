import React, { useMemo } from 'react';

const FeaturesSection = React.memo(() => {
    const features = useMemo(() => [
        {
            icon: 'fa-globe',
            title: 'Digital Transformation',
            desc: 'Streamlining paper-based processes with modern digital solutions for efficient agricultural management.'
        },
        {
            icon: 'fa-handshake',
            title: 'Collaboration',
            desc: 'Linking all agricultural stakeholders in a unified platform for seamless communication and coordination.'
        },
        {
            icon: 'fa-leaf',
            title: 'Sustainability',
            desc: 'Enabling smart, data-driven farming decisions that promote sustainable agricultural practices.'
        }
    ], []);

    return (
        <section className="features" id="features" aria-label="Features">
            <h2>About AgriConnect</h2>
            <p>Modernizing Sri Lanka&apos;s agriculture management process</p>
            <div className="features-grid">
                {features.map((feature, idx) => (
                    <div key={idx} className="feature-card">
                        <i className={`fas ${feature.icon}`} aria-hidden="true"></i>
                        <h3>{feature.title}</h3>
                        <p>{feature.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
});

FeaturesSection.displayName = 'FeaturesSection';

export default FeaturesSection;
