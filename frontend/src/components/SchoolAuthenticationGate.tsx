import React, { useState, useMemo } from "react";
import { Lock, GraduationCap, ArrowRight } from "lucide-react";

interface SchoolAuthenticationGateProps {
  studentListRaw: string | string[]; // Can be a comma/newline separated string or an array
  onAuthenticate: (studentName: string) => void;
  eventTitle: string;
}

export const SchoolAuthenticationGate: React.FC<SchoolAuthenticationGateProps> = ({
  studentListRaw,
  onAuthenticate,
  eventTitle
}) => {
  const [selectedStudent, setSelectedStudent] = useState("");

  const students = useMemo(() => {
    if (Array.isArray(studentListRaw)) return studentListRaw;
    if (!studentListRaw) return [];
    
    // Parse comma or newline separated names
    return studentListRaw
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .sort();
  }, [studentListRaw]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent) {
      onAuthenticate(selectedStudent);
    }
  };

  return (
    <div className="max-w-md mx-auto my-20 p-8 md:p-10 bg-theme-bg-muted border border-theme-border rounded-[30px] animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col items-center text-center space-y-6 mb-10">
        <div className="w-16 h-16 bg-brand-tactical/10 rounded-full flex items-center justify-center text-brand-tactical border border-brand-tactical/20">
          <GraduationCap size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold uppercase text-theme-text mb-2">Acesso Restrito</h2>
          <p className="text-[10px] uppercase tracking-widest font-bold text-theme-text-muted">
            Por segurança, selecione o nome do aluno para acessar o material de <span className="text-brand-tactical">{eventTitle}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-theme-text-muted flex items-center gap-2">
            <Lock size={12} className="text-brand-tactical" /> Nome do Aluno
          </label>
          <div className="relative">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
              className="w-full bg-theme-bg/50 border border-theme-border py-4 px-5 text-sm font-bold uppercase tracking-wide text-theme-text outline-none focus:border-brand-tactical rounded-xl appearance-none cursor-pointer"
            >
              <option value="" disabled>SELECIONE NA LISTA...</option>
              {students.map(student => (
                <option key={student} value={student}>{student}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedStudent}
          className="w-full py-4 bg-brand-tactical text-black font-bold uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:hover:bg-brand-tactical flex items-center justify-center gap-3 group"
        >
          Acessar Galeria
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </div>
  );
};
