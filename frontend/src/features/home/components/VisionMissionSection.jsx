import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Home.module.css';

const VisionMissionSection = React.memo(() => {
    const { t } = useTranslation('home');
    const visionMission = useMemo(() => [
        { icon: 'fa-eye', title: t('visionMission.vision.title'), desc: t('visionMission.vision.desc') },
        { icon: 'fa-bullseye', title: t('visionMission.mission.title'), desc: t('visionMission.mission.desc') }
    ], [t]);

    return (
        <section className={styles.visionMission} aria-label="Vision and mission">
            <h2>{t('visionMission.title')}</h2>
            <p>{t('visionMission.subtitle')}</p>
            <div className={styles.vmGrid}>
                {visionMission.map((item, idx) => (
                    <div key={item.title} className={styles.vmCard}>
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
