// src/app/dados/components/Header.js
import { Search, Bell } from 'lucide-react';
import styles from '@/styles/dados.module.css';

const Header = ({ title, subtitle, date }) => {
  const today = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subtitleText = subtitle || date || today;

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.headerTitle}>{title}</h1>
        {subtitleText && <p className={styles.headerSubtitle}>{subtitleText}</p>}
      </div>
    </header>
  );
};

export default Header;
