import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Menu, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  Construction, 
  Package, 
  Star, 
  Phone, 
  Mail, 
  Facebook, 
  Instagram, 
  Youtube,
  ArrowRight,
  ShieldCheck,
  Clock,
  ThumbsUp,
  ChevronsRight,
  MapPin,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

// --- Firebase Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          errorMessage = "You don't have permission to perform this action. Please check your security rules.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-secondary mb-4">Application Error</h2>
            <p className="text-secondary/60 mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-3 flex justify-center"
            >
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Firebase Provider ---

const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Sign in anonymously if not already signed in
        signInAnonymously(auth).catch(err => {
          console.error("Anonymous sign-in failed", err);
          // Don't block the app if auth fails, just log it
          setIsAuthReady(true);
        });
      } else {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

// --- Components ---

const ButtonPrimary = ({ children, href, className = "" }: { children: React.ReactNode, href: string, className?: string }) => (
  <a href={href} className={`btn-primary ${className}`}>
    <span>{children}</span>
    <div className="btn-icon-circle">
      <ChevronsRight className="w-5 h-5" />
    </div>
  </a>
);

const ButtonOutline = ({ children, href, className = "" }: { children: React.ReactNode, href: string, className?: string }) => (
  <a href={href} className={`btn-outline ${className}`}>
    <span>{children}</span>
    <div className="btn-icon-circle">
      <ChevronsRight className="w-5 h-5" />
    </div>
  </a>
);

// --- Types ---
interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
}

// --- Data ---
const SERVICES: Service[] = [
  {
    id: 'post-construction',
    title: 'Post-Construction Cleaning',
    description: 'Expert removal of dust, debris, and construction residue to make your new space move-in ready.',
    icon: <Construction className="w-8 h-8" />,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'janitorial',
    title: 'Janitorial Services',
    description: 'Comprehensive daily or weekly cleaning solutions for offices, commercial buildings, and retail spaces.',
    icon: <Sparkles className="w-8 h-8" />,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'supplies',
    title: 'Supplies & Products',
    description: 'High-quality professional cleaning products and equipment for all your maintenance needs.',
    icon: <Package className="w-8 h-8" />,
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=800'
  }
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Michael B.',
    role: 'Project Manager',
    content: 'ELX Services and Supply handled our post-construction cleanup for a 50-unit complex. Their attention to detail was incredible. The site was spotless.',
    rating: 5
  },
  {
    id: '2',
    name: 'Rachel S.',
    role: 'Facility Director',
    content: 'We have been using their janitorial services for over a year now. Reliable, professional, and always consistent. Highly recommend!',
    rating: 5
  },
  {
    id: '3',
    name: 'Mark D.',
    role: 'Business Owner',
    content: 'Their cleaning supplies are top-notch. We switched our entire inventory to ELX products and have seen a noticeable difference in cleanliness.',
    rating: 5
  }
];

const FAQS = [
  {
    question: "What areas do you serve?",
    answer: "We provide services across the metropolitan area and surrounding suburbs. Contact us to confirm if we cover your specific location."
  },
  {
    question: "Are your cleaning products eco-friendly?",
    answer: "Yes, we offer a wide range of eco-friendly and biodegradable cleaning solutions that are safe for both people and the environment."
  },
  {
    question: "Do you offer emergency cleaning services?",
    answer: "We do! We understand that some situations require immediate attention. Our team is available for urgent cleaning needs 24/7."
  }
];

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-primary font-bold text-xl group-hover:rotate-12 transition-transform">
            E
          </div>
          <span className={`font-bold text-xl tracking-tight text-secondary`}>
            ELX Services and Supply
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-secondary/80 hover:text-primary font-medium transition-all hover:-translate-y-0.5 hover:font-bold text-sm uppercase tracking-wider"
            >
              {link.name}
            </a>
          ))}
          <ButtonPrimary href="tel:+1234567890" className="scale-90">
            +1 (234) 567-890
          </ButtonPrimary>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-secondary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsOpen(false)}
                  className="text-secondary font-medium text-lg"
                >
                  {link.name}
                </a>
              ))}
              <ButtonPrimary href="tel:+1234567890" className="justify-center">
                +1 (234) 567-890
              </ButtonPrimary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-background">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-20 z-0" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            <ShieldCheck className="w-4 h-4" />
            Licensed & Insured LLC
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-secondary leading-[1.1] mb-6">
            Pristine Spaces, <br />
            <span className="text-primary">Professional</span> Care.
          </h1>
          <p className="text-lg text-secondary/70 mb-8 max-w-lg leading-relaxed">
            ELX Services and Supply delivers top-tier post-construction cleaning, janitorial excellence, and premium supplies to keep your environment healthy and spotless.
          </p>
          <div className="flex flex-wrap gap-4">
            <ButtonPrimary href="#services">
              Our Services
            </ButtonPrimary>
          </div>
          
          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <div>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm font-medium text-secondary">Trusted by 500+ clients</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="bg-primary p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Get Expert Help Today!
            </h2>
            <p className="text-white/80 text-sm mb-8 leading-relaxed">
              Our professional cleaning teams deliver fast, reliable, and affordable services tailored to your needs.
            </p>
            
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:bg-white/20 focus:border-accent outline-none transition-all" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:bg-white/20 focus:border-accent outline-none transition-all" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Required Service</label>
                <select className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white focus:bg-white/20 focus:border-accent outline-none transition-all appearance-none cursor-pointer">
                  <option className="bg-primary">Select your required services</option>
                  <option className="bg-primary">Post-Construction Cleaning</option>
                  <option className="bg-primary">Janitorial Services</option>
                  <option className="bg-primary">Supplies & Products</option>
                </select>
              </div>
              
              <button type="submit" className="btn-primary w-full py-2 flex justify-center mt-4">
                <span>Schedule A Service</span>
                <div className="btn-icon-circle">
                  <ChevronsRight className="w-5 h-5" />
                </div>
              </button>
            </form>
          </div>
          
          {/* Floating Badge */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 -right-6 bg-accent p-6 rounded-2xl shadow-xl border border-primary/10 hidden sm:block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-accent">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-primary/50 font-bold uppercase tracking-wider">Quality Guaranteed</p>
                <p className="text-lg font-bold text-primary">100% Satisfaction</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const InteractiveEcosystem = () => {
  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto perspective-1000">
      <svg viewBox="0 0 800 800" className="w-full h-full drop-shadow-2xl">
        {/* Connection Lines */}
        <motion.path
          d="M 200 400 L 400 400 M 400 400 L 600 400"
          stroke="var(--color-primary)"
          strokeWidth="1"
          strokeDasharray="4 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.2 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Left Node: Active Construction Site */}
        <motion.g
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Scaffolding Structure */}
          <path d="M 150 350 L 250 350 M 150 450 L 250 450 M 170 350 L 170 450 M 230 350 L 230 450" stroke="#94a3b8" strokeWidth="2" fill="none" />
          <path d="M 150 350 L 250 450 M 250 350 L 150 450" stroke="#94a3b8" strokeWidth="1" opacity="0.3" fill="none" />

          {/* Construction Cones */}
          <motion.path
            d="M 160 440 L 175 410 L 190 440 Z"
            fill="#f97316"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.path
            d="M 230 440 L 245 410 L 260 440 Z"
            fill="#f97316"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />

          {/* Debris */}
          <motion.circle cx="180" cy="430" r="4" fill="#64748b" animate={{ x: [0, 2, 0] }} transition={{ duration: 3, repeat: Infinity }} />
          <motion.rect x="210" y="425" width="8" height="8" fill="#475569" animate={{ rotate: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} />

          <foreignObject x="140" y="470" width="120" height="30">
            <div className="text-center text-[8px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
              CONSTRUCTION SITE
            </div>
          </foreignObject>
        </motion.g>

        {/* Central Hub: ELX Operations */}
        <motion.g
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <ellipse cx="400" cy="440" rx="100" ry="30" fill="var(--color-primary)" opacity="0.1" />
          <motion.ellipse 
            cx="400" cy="400" rx="120" ry="40" 
            fill="var(--color-accent)" 
            stroke="var(--color-primary)" 
            strokeWidth="2"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse 
            cx="400" cy="360" rx="100" ry="35" 
            fill="white" 
            stroke="var(--color-primary)" 
            strokeWidth="2"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          
          {/* Human Figures (Workers) */}
          {[360, 440].map((x, i) => (
            <motion.g key={i} animate={{ x: [0, 10, 0], y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}>
              <circle cx={x} cy="380" r="6" fill="var(--color-primary)" />
              <path d={`M ${x-4} 390 Q ${x} 410 ${x+4} 390`} stroke="var(--color-primary)" strokeWidth="8" strokeLinecap="round" />
            </motion.g>
          ))}

          <foreignObject x="300" y="280" width="200" height="40">
            <div className="flex justify-center">
              <div className="bg-white border border-primary/20 px-4 py-1 rounded text-[10px] font-mono font-bold text-primary tracking-widest uppercase shadow-sm">
                ELX CREW
              </div>
            </div>
          </foreignObject>
        </motion.g>

        {/* Right Node: Pristine Result */}
        <motion.g
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          {/* Polished "Clean" Shapes */}
          <motion.rect
            x="570" y="370" width="60" height="60" rx="12"
            fill="white"
            stroke="var(--color-primary)"
            strokeWidth="1"
            animate={{ 
              scale: [1, 1.05, 1],
              boxShadow: ["0 0 0px var(--color-accent)", "0 0 20px var(--color-accent)", "0 0 0px var(--color-accent)"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          {/* Sparkles */}
          {[0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d="M 0 -5 L 1 -1 L 5 0 L 1 1 L 0 5 L -1 1 L -5 0 L -1 -1 Z"
              fill="var(--color-accent)"
              initial={{ x: 600 + (i * 20) - 20, y: 380 + (i * 15), scale: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                rotate: [0, 90, 180]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.6,
                ease: "easeInOut"
              }}
            />
          ))}
          <foreignObject x="540" y="460" width="120" height="30">
            <div className="text-center text-[8px] font-mono font-bold text-primary uppercase tracking-tighter">
              PRISTINE FACILITY
            </div>
          </foreignObject>
        </motion.g>

        {/* Cleaning Units (Particles) moving from Hub to Site */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`to-site-${i}`}
            r="4"
            fill="var(--color-primary)"
            initial={{ offsetDistance: "0%" }}
            animate={{ offsetDistance: "100%" }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeIn"
            }}
            style={{
              offsetPath: "path('M 400 400 L 200 400')",
            }}
          />
        ))}

        {/* "Clean Energy" moving from Hub to Result */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`to-result-${i}`}
            r="3"
            fill="var(--color-accent)"
            initial={{ offsetDistance: "0%" }}
            animate={{ offsetDistance: "100%" }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeOut"
            }}
            style={{
              offsetPath: "path('M 400 400 L 600 400')",
            }}
          />
        ))}

        {/* Interactive Tooltip */}
        <g className="cursor-pointer group">
          <circle cx="400" cy="400" r="100" fill="transparent" />
          <foreignObject x="325" y="480" width="150" height="60" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-white p-2 rounded-lg shadow-xl border border-primary/10 text-center">
              <p className="text-[9px] font-bold text-primary uppercase">Active Cleaning</p>
              <p className="text-[7px] text-primary/60">Our crew is on-site, transforming the space.</p>
            </div>
          </foreignObject>
        </g>
      </svg>
    </div>
  );
};

const About = () => {
  return (
    <section id="about" className="section-padding bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
        <div className="order-2 md:order-1 relative">
          <InteractiveEcosystem />
          
          {/* Background Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/20 rounded-full blur-3xl -z-10" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="order-1 md:order-2"
        >
          <p className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Who We Are</p>
          <h2 className="text-4xl md:text-5xl font-bold text-secondary mb-8 leading-tight">
            Modern Cleaning <span className="text-primary/40 font-bold">Infrastructure</span> For Your Business
          </h2>
          <p className="text-lg text-secondary/70 mb-10 leading-relaxed">
            ELX Services and Supply specializes in the critical transition from construction site to operational facility. We provide the specialized infrastructure needed to handle post-construction debris, dust, and deep cleaning, ensuring your business opens in a pristine environment.
          </p>
          
          <ul className="space-y-4 mb-10">
            {['Post-construction deep cleaning', 'Specialized debris removal', 'Eco-friendly sanitization', 'Premium supply management'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-secondary font-medium">
                <CheckCircle2 className="text-primary w-5 h-5" />
                {item}
              </li>
            ))}
          </ul>
          
          <ButtonPrimary href="#contact">Schedule A Service</ButtonPrimary>
        </motion.div>
      </div>
    </section>
  );
};

const Services = () => {
  const expertise = [
    {
      title: "Post-construction deep cleaning",
      desc: "Comprehensive removal of dust, debris, and construction residue to prepare your facility for immediate operation."
    },
    {
      title: "Specialized debris removal",
      desc: "Safe and efficient disposal of bulk construction waste and hazardous materials using industrial-grade equipment."
    },
    {
      title: "Premium supply management",
      desc: "Access to high-grade cleaning agents and specialized equipment tailored for sensitive industrial surfaces."
    },
    {
      title: "Multi-point quality assurance",
      desc: "Rigorous inspection protocols baked into our workflow to ensure every square inch meets operational standards."
    },
    {
      title: "Eco-friendly sanitization",
      desc: "Hospital-grade disinfectants that are powerful enough for construction sites but safe for your staff and the environment."
    },
    {
      title: "Scalable crew deployment",
      desc: "Rapid mobilization of specialized teams to meet tight opening deadlines and handle large-scale facility transitions."
    }
  ];

  return (
    <section id="services" className="section-padding bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h2 className="text-5xl md:text-7xl font-bold text-secondary mb-8 leading-[1.1] tracking-tight">
            Perfected for the most demanding facilities
          </h2>
          <p className="text-xl text-secondary/70 leading-relaxed max-w-2xl mx-auto">
            Custom cleaning protocols and industrial-grade logistics are integrated into the ELX Operational Framework.
          </p>
        </div>

        <div className="grid md:grid-cols-3 border-t border-l border-gray-200">
          {expertise.map((item, index) => (
            <div 
              key={index} 
              className="p-12 border-r border-b border-gray-200 hover:bg-white transition-colors duration-300 group"
            >
              <h3 className="text-xl font-bold text-secondary mb-4 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-secondary/60 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Benefits = () => {
  const benefits = [
    { title: 'Reliability', desc: 'We show up on time, every time, with the right equipment.', icon: <Clock /> },
    { title: 'Quality', desc: 'Our multi-point inspection ensures no corner is left untouched.', icon: <ThumbsUp /> },
    { title: 'Safety', desc: 'Fully insured and bonded LLC for your complete peace of mind.', icon: <ShieldCheck /> },
  ];

  return (
    <section id="benefits" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {benefits.map((benefit, index) => (
            <motion.div 
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-secondary mb-4">{benefit.title}</h3>
              <p className="text-secondary/60 leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Reviews = () => {
  return (
    <section className="section-padding bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-secondary mb-4">What Our Clients Say</h2>
          <div className="flex flex-col items-center gap-2">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-6 h-6 fill-current" />)}
            </div>
            <span className="font-bold text-secondary text-lg">4.9/5 Average Rating</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div key={t.id} className="card bg-gray-50 border-none">
              <div className="flex text-yellow-400 mb-4">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-secondary/70 italic mb-6 leading-relaxed">"{t.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-secondary">{t.name}</h4>
                  <p className="text-xs text-secondary/50 font-medium uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section-padding bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-bold uppercase tracking-widest text-sm mb-4">FAQ</p>
          <h2 className="text-4xl font-bold text-secondary mb-6">Got Questions?</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-secondary">{faq.question}</span>
                <ChevronRight className={`w-5 h-5 text-primary transition-transform ${openIndex === index ? 'rotate-90' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="p-6 pt-0 text-secondary/60 leading-relaxed border-t border-gray-50">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    service: 'Select your required services'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.service === 'Select your required services') {
      alert("Please select a service.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const path = 'leads';
    try {
      await addDoc(collection(db, path), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setSubmitStatus('success');
      setFormData({ fullName: '', phoneNumber: '', service: 'Select your required services' });
    } catch (error) {
      setSubmitStatus('error');
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
        <div>
          <p className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Contact Us</p>
          <h2 className="text-4xl font-bold text-secondary mb-6">Get a Free Quote Today</h2>
          <p className="text-secondary/70 mb-12 leading-relaxed">
            Ready to experience the ELX difference? Fill out the form and our team will get back to you within 24 hours with a customized proposal.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-secondary mb-1">Call Us</h4>
                <p className="text-secondary/60">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-secondary mb-1">Email Us</h4>
                <p className="text-secondary/60">hello@elxservices-and-supply.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-primary p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Get Expert Help Today!
          </h2>
          <p className="text-white/80 text-sm mb-8 leading-relaxed">
            Our professional cleaning teams deliver fast, reliable, and affordable services tailored to your needs.
          </p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your name" 
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:bg-white/20 focus:border-accent outline-none transition-all" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Phone Number</label>
              <input 
                type="tel" 
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="Phone Number" 
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:bg-white/20 focus:border-accent outline-none transition-all" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Required Service</label>
              <select 
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white focus:bg-white/20 focus:border-accent outline-none transition-all appearance-none cursor-pointer"
              >
                <option className="bg-primary">Select your required services</option>
                <option className="bg-primary">Post-Construction Cleaning</option>
                <option className="bg-primary">Janitorial Services</option>
                <option className="bg-primary">Supplies & Products</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full py-2 flex justify-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Sending...' : 'Schedule A Service'}</span>
              <div className="btn-icon-circle">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronsRight className="w-5 h-5" />}
              </div>
            </button>

            {submitStatus === 'success' && (
              <p className="text-accent text-sm font-bold text-center mt-4">
                Thank you! We'll get back to you shortly.
              </p>
            )}
            {submitStatus === 'error' && (
              <p className="text-red-400 text-sm font-bold text-center mt-4">
                Something went wrong. Please try again later.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-secondary text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <a href="#" className="flex items-center gap-2 mb-6 group">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-primary font-bold text-xl group-hover:rotate-12 transition-transform">
                E
              </div>
              <span className="font-bold text-xl tracking-tight text-white transition-colors">
                ELX Services and Supply
              </span>
            </a>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-sm">
              Professional cleaning services and premium supplies for homes and businesses. Licensed and insured LLC.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:text-accent transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:text-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:text-accent transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><a href="#about" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="#services" className="hover:text-accent transition-colors">Our Services</a></li>
              <li><a href="#benefits" className="hover:text-accent transition-colors">Benefits</a></li>
              <li><a href="#contact" className="hover:text-accent transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-bold mb-6">Services</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><a href="#" className="hover:text-accent transition-colors">Post-Construction</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Janitorial Care</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Retail Supplies</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Commercial Cleaning</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li className="flex items-center gap-3 group">
                <Phone className="w-4 h-4 text-accent transition-colors" />
                <a href="tel:+1234567890" className="hover:text-accent transition-colors">+1 (234) 567-890</a>
              </li>
              <li className="flex items-center gap-3 group">
                <Mail className="w-4 h-4 text-accent transition-colors" />
                <a href="mailto:hello@elxservices-and-supply.com" className="hover:text-accent transition-colors">hello@elxservices-and-supply.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} ELX Services and Supply LLC. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-white/30">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <div className="min-h-screen">
          <Navbar />
          <main>
            <Hero />
            <About />
            <Services />
            <Benefits />
            <Reviews />
            <FAQ />
            <Contact />
          </main>
          <Footer />
        </div>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
