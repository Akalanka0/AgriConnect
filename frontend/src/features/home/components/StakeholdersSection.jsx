import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Home.module.css';

const StakeholdersSection = React.memo(() => {
    const { t } = useTranslation('home');
    const stakeholders = useMemo(() => [
        { icon: 'fa-user-tie', title: t('stakeholders.farmer.title'), desc: t('stakeholders.farmer.desc') },
        { icon: 'fa-chalkboard-teacher', title: t('stakeholders.instructor.title'), desc: t('stakeholders.instructor.desc') },
        { icon: 'fa-user-cog', title: t('stakeholders.admin.title'), desc: t('stakeholders.admin.desc') }
    ], [t]);

    return (
        <section className={styles.stakeholders} id="stakeholders" aria-label="Stakeholders">
            <h2>{t('stakeholders.title')}</h2>
            <p>{t('stakeholders.subtitle')}</p>
            <div className={styles.stakeholdersGrid}>
                {stakeholders.map((stakeholder, idx) => (
                    <div key={idx} className={styles.stakeholderCard}>
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
