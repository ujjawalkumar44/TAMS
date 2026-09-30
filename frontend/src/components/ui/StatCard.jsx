export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const styles = {
    blue: {
      wrapper: 'from-blue-50/50 to-indigo-50/50 border-blue-100/60',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20',
      text: 'text-blue-700',
    },
    green: {
      wrapper: 'from-emerald-50/50 to-teal-50/50 border-emerald-100/60',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20',
      text: 'text-emerald-700',
    },
    purple: {
      wrapper: 'from-purple-50/50 to-fuchsia-50/50 border-purple-100/60',
      iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-purple-500/20',
      text: 'text-purple-700',
    },
    orange: {
      wrapper: 'from-orange-50/50 to-amber-50/50 border-orange-100/60',
      iconBg: 'bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-500/20',
      text: 'text-orange-700',
    },
    red: {
      wrapper: 'from-red-50/50 to-rose-50/50 border-red-100/60',
      iconBg: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20',
      text: 'text-red-700',
    },
  };

  const style = styles[color] || styles.blue;

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${style.wrapper} bg-white/60 backdrop-blur-md`}>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold tracking-tight text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">{value}</p>
          {subtitle && <p className={`mt-1.5 text-xs font-medium ${style.text}`}>{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md ${style.iconBg}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
      <div className="absolute -right-6 -top-6 z-0 h-24 w-24 rounded-full bg-white/40 blur-2xl"></div>
    </div>
  );
}
