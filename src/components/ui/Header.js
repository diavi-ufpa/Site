'use client';

import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import styles from '@/styles/dados.module.css';

const Header = ({ title, subtitle, date }) => {
  const [formattedDate, setFormattedDate] = useState(date || '');

  useEffect(() => {
    if (!date) {
      const now = new Date();
      setFormattedDate(
        now.toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    } else {
      setFormattedDate(date);
    }
  }, [date]);

  return (
    <header className={styles.header}>
      <div className={styles.headerTextGroup}>
        <h1 className={styles.headerTitle}>{title}</h1>
        {subtitle && <p className={styles.headerSubtitle}>{subtitle}</p>}
      </div>
      <div className={styles.headerDateBadge} suppressHydrationWarning>
        <Calendar size={15} color="#FF8E29" />
        <span>{formattedDate || date || 'Hoje'}</span>
      </div>
    </header>
  );
};

export default Header;
