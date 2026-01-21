import React, { useMemo } from 'react';

const VisionMissionSection = React.memo(() => {
    const visionMission = useMemo(() => [
        {
            icon: 'fa-eye',
            title: 'Our Vision',
            desc: 'To empower the agricultural community of Sri Lanka through digital technology, promoting efficient farm management, transparent data exchange, and sustainable growth.'
        },
        {
            icon: 'fa-bullseye',
            title: 'Our Mission',
            desc: 'To provide an integrated platform that connects farmers, instructors, and administrators for smarter, faster, and more collaborative agricultural operations.'
        }
    ], []);

    return (
        <section className="vision-mission" aria-label="Vision and mission">
            <h2>Our Vision & Mission</h2>
            <p>Guiding principles for agricultural transformation</p>
            <div className="vm-grid">
                {visionMission.map((item, idx) => (
                    <div key={idx} className="vm-card">
                        <h3>
                            <i className={`fas ${item.icon}`} aria-hidden="true"></i>
                            {item.title}
                        </h3>
                        <p>{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
});

VisionMissionSection.displayName = 'VisionMissionSection';

export default VisionMissionSection;
