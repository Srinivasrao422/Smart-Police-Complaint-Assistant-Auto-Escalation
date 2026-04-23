// Maps complaint categories → handling department & default SLA (hours)
export const departmentMap: Record<
  string,
  { department: string; sla: number; officer: string }
> = {
  theft: { department: "Crime Branch", sla: 72, officer: "SI R. Verma" },
  cyber: { department: "Cyber Cell", sla: 48, officer: "Insp. A. Khan" },
  vehicle: { department: "Traffic Police", sla: 96, officer: "ASI M. Singh" },
  missing: { department: "Special Investigation Unit", sla: 24, officer: "Insp. P. Rao" },
  domestic: { department: "Women & Child Safety Cell", sla: 48, officer: "SI N. Desai" },
  fraud: { department: "Economic Offences Wing", sla: 72, officer: "Insp. S. Gupta" },
};

export const getDepartment = (categoryId: string) =>
  departmentMap[categoryId] || {
    department: "General Diary Section",
    sla: 96,
    officer: "Duty Officer",
  };
