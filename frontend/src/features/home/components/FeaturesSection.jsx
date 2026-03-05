import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Home.module.css';

const FeaturesSection = React.memo(() => {
    const { t } = useTranslation('home');
    const features = useMemo(() => [
        { icon: 'fa-globe', title: t('features.items.digital.title'), desc: t('features.items.digital.desc') },
        { icon: 'fa-handshake', title: t('features.items.collaboration.title'), desc: t('features.items.collaboration.desc') },
        { icon: 'fa-leaf', title: t('features.items.sustainability.title'), desc: t('features.items.sustainability.desc') }
    ], [t]);

    return (
        <section className={styles.features} id="features" aria-label="Features">
            <h2>{t('features.title')}</h2>
            <p>{t('features.subtitle')}</p>
            <div className={styles.featuresGrid}>
                {features.map((feature, idx) => (
                    <div key={idx} className={styles.featureCard}>
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
