import { Truck, ShieldCheck, CreditCard, TicketPercent } from "lucide-react";

const BENEFITS = [
  {
    icon: Truck,
    title: "Envío Gratis",
    desc: "En pedidos superiores a $999 MXN"
  },
  {
    icon: ShieldCheck,
    title: "Autenticidad Garantizada",
    desc: "Calidad Garantizada"
  },
  {
    icon: TicketPercent,
    title: "Programa de Lealtad",
    desc: "10% de Descuento en tu primera compra"
  },
  {
    icon: CreditCard,
    title: "Pago Seguro",
    desc: "Tus datos protegidos con encriptación SSL"
  }
];

const Benefits = () => {
  return (
    <section className="bg-black border-y border-white/10 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {BENEFITS.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center p-4">
              <div className="mb-4 p-3 bg-white/5 rounded-full text-[#00d2d3]">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-1">
                {item.title}
              </h3>
              <p className="text-gray-500 text-xs font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;