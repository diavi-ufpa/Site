import Link from 'next/link';
import { ArrowRight, BarChart3, Building2, BookOpen, Layers } from 'lucide-react';
import Header from '@/components/ui/Header';
import styles from '../../../styles/dados.module.css';

export default function AvaliacaoInLocoPage() {
  return (
    <div className={styles.mainContent}>
      <Header
        title="Avaliação In Loco • SINAES / INEP"
        subtitle="Instrumento de avaliação institucional e de cursos de graduação da UFPA"
      />

      <section
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '32px',
          lineHeight: 1.65,
          boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#0F172A' }}>
          Sobre a Avaliação In Loco
        </h2>

        <p style={{ marginBottom: 16, color: '#334155', fontSize: '1rem' }}>
          A <strong>Avaliação In Loco</strong> é realizada por comissões de avaliadores do <strong>INEP/MEC</strong> no âmbito do <strong>Sistema Nacional de Avaliação da Educação Superior (SINAES)</strong>. O processo visa aferir as condições de funcionamento e a qualidade dos cursos de graduação e das instituições de ensino superior.
        </p>

        <p style={{ marginBottom: 16, color: '#334155', fontSize: '1rem' }}>
          Os instrumentos avaliativos estruturam-se em três dimensões fundamentais que expressam a qualidade do percurso formativo oferecido pela Universidade Federal do Pará (UFPA):
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            margin: '24px 0',
          }}
        >
          <div
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: 12,
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  background: '#1D556F',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                D1
              </span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                Organização Didático-Pedagógica
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#64748B' }}>
              Projeto pedagógico do curso, currículo, metodologias de ensino-aprendizagem, estágio e atividades complementares.
            </p>
          </div>

          <div
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: 12,
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  background: '#FF8E29',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                D2
              </span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                Corpo Docente e Tutorial
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#64748B' }}>
              Titulação, regime de trabalho docente, experiência profissional, produção científica e atuação tutorial.
            </p>
          </div>

          <div
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: 12,
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  background: '#288FB4',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                D3
              </span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                Infraestrutura
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#64748B' }}>
              Salas de aula, laboratórios especializados, acervo bibliográfico, acessibilidade e recursos de tecnologia.
            </p>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #e5e7eb', margin: '24px 0' }} />

        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#0F172A' }}>
          Escala e Conceitos do INEP
        </h3>
        <p style={{ color: '#334155', fontSize: '0.95rem', marginBottom: 12 }}>
          Os indicadores avaliativos recebem pontuação de <strong>1 a 5</strong>, gerando a média de cada dimensão e o <strong>Conceito de Curso (CC)</strong> consolidado:
        </p>

        <ul style={{ margin: 0, paddingLeft: 20, color: '#334155', fontSize: '0.95rem', lineHeight: 1.8 }}>
          <li><strong>Conceitos 1 e 2:</strong> Desempenho insuficiente / insatisfatório em relação aos referenciais de qualidade.</li>
          <li><strong>Conceito 3:</strong> Desempenho satisfatório que atende integralmente aos padrões normativos.</li>
          <li><strong>Conceitos 4 e 5:</strong> Desempenho muito bom ou excelente, superando os padrões mínimos exigidos.</li>
        </ul>

        <div style={{ marginTop: 28 }}>
          <Link
            href="/portal/avaliacaoInLoco/dados"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#FF8E29',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '12px 24px',
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(255, 142, 41, 0.3)',
            }}
          >
            <BarChart3 size={18} />
            <span>Acessar Painel de Dados e Indicadores In Loco</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
