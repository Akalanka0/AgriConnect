import React, { useMemo } from 'react';

const StakeholdersSection = React.memo(() => {
    const stakeholders = useMemo(() => [
        {
            icon: 'fa-user-tie',
            title: 'Farmer',
            desc: 'Access personalized dashboards to record crop activities, view alerts, and receive guidance from instructors.'
        },
        {
            icon: 'fa-chalkboard-teacher',
            title: 'Instructor',
            desc: 'Support farmers by reviewing plans, monitoring progress, and providing expert advice digitally.'
        },
        {
            icon: 'fa-user-cog',
            title: 'Administrator',
            desc: 'Oversee all registered users, analyze trends, and make informed decisions at the district level.'
        }
    ], []);

    return (
        <section className="stakeholders" id="stakeholders" aria-label="Stakeholders">
            <h2>Stakeholders</h2>
            <p>Connecting all participants in the agricultural ecosystem</p>
            <div className="stakeholders-grid">
                {stakeholders.map((stakeholder, idx) => (
                    <div key={idx} className="stakeholder-card">
                        <i className={`fas ${stakeholder.icon}`} aria-hidden="true"></i>
                        <h3>{stakeholder.title}</h3>
                        <p>{stakeholder.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
});

StakeholdersSection.displayName = 'StakeholdersSection';

export default StakeholdersSection;
