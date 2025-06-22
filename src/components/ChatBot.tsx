import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { MessageCircle, X, Send, Bot, User, HelpCircle, TrendingUp, FileText, Stethoscope, Pill, Calculator, Users, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  category?: 'medical' | 'business' | 'general' | 'symptom' | 'lab' | 'medication' | 'inventory' | 'order' | 'appointment';
  isFollowUp?: boolean;
}

interface ConversationContext {
  lastTopic?: string;
  userMedications?: string[];
  pendingReminders?: boolean;
  lastSymptoms?: string[];
  awaitingFollowUp?: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const getRoleSpecificGreeting = () => {
        if (!user) return "Hello! 👋 I'm your BEPAWA assistant. How can I help you today?";
        
        switch (user.role) {
          case 'individual':
            return `Hello ${user.name}! 👋 I'm your personal health assistant. I can help with medication tracking, symptom checking, finding nearby services, and connecting you with pharmacists. What can I help you with today?`;
          case 'retail':
            return `Welcome back, ${user.pharmacyName}! 🏪 I'm your business assistant. I can provide inventory insights, restock suggestions, order summaries, and even generate quick invoices. How can I assist your pharmacy today?`;
          case 'wholesale':
            return `Hello ${user.businessName}! 📦 I can help with bulk order planning, profitability analysis, distributor management, and retailer support. What would you like to explore?`;
          case 'lab':
            return `Welcome, ${user.labName}! 🔬 I can assist with smart test routing, appointment management, result interpretation, and referral generation. How can I help your laboratory today?`;
          case 'admin':
            return `Hello Admin! 👨‍💼 I can help with platform analytics, user management, system monitoring, and operational insights. What would you like to review?`;
          default:
            return "Hello! 👋 I'm your BEPAWA assistant. How can I help you today?";
        }
      };

      const getRoleSpecificSuggestions = () => {
        if (!user) return ['How do I get started?', 'What services do you offer?', 'Contact support'];
        
        switch (user.role) {
          case 'individual':
            return ['Track my medications', 'Check symptoms', 'Find nearby pharmacies', 'Ask a pharmacist'];
          case 'retail':
            return ['Inventory insights', 'Restock suggestions', 'Order summary', 'Generate invoice'];
          case 'wholesale':
            return ['Bulk order assistant', 'Profit analysis', 'Retailer management', 'Market trends'];
          case 'lab':
            return ['Recommend tests', 'Appointment schedule', 'Interpret results', 'Generate referral'];
          case 'admin':
            return ['Platform analytics', 'User insights', 'System status', 'Revenue reports'];
          default:
            return ['Platform features', 'Getting started', 'Contact support'];
        }
      };

      const greeting: Message = {
        id: '1',
        type: 'bot',
        content: getRoleSpecificGreeting(),
        timestamp: new Date(),
        suggestions: getRoleSpecificSuggestions(),
        category: 'general'
      };
      setMessages([greeting]);
    }
  }, [isOpen, user]);

  // Individual Role Features
  const getMedicationTrackerResponse = (query: string): Message => {
    const medications = ['Metformin 500mg - 2x daily', 'Lisinopril 10mg - 1x daily', 'Vitamin D - 1x daily'];
    
    if (query.toLowerCase().includes('add') || query.toLowerCase().includes('new')) {
      return {
        id: Date.now().toString(),
        type: 'bot',
        content: `💊 **Medication Tracker**\n\nTo add a new medication, I'll need:\n• Medication name and dosage\n• Frequency (how often)\n• When to take it\n• Duration of treatment\n\nWhat medication would you like to add?`,
        timestamp: new Date(),
        suggestions: ['Add Paracetamol 500mg', 'Set reminder for current meds', 'View my medications'],
        category: 'medication'
      };
    }

    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `💊 **Your Current Medications**\n\n${medications.map((med, i) => `${i + 1}. ${med}`).join('\n')}\n\n⏰ **Next Reminders:**\n• Metformin - Due in 2 hours\n• Lisinopril - Due tomorrow morning\n\nWould you like to add a new medication or set up reminders?`,
      timestamp: new Date(),
      suggestions: ['Add new medication', 'Set reminder times', 'Mark as taken', 'Refill reminder'],
      category: 'medication'
    };
  };

  const getNearbyServicesResponse = (): Message => {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `📍 **Nearby Healthcare Services**\n\n🏥 **Pharmacies Near You:**\n• Duka la Dawa - 0.5km (Open 24/7)\n• HealthCare Pharmacy - 1.2km (8AM-10PM)\n• City Medical Store - 1.8km (9AM-9PM)\n\n🔬 **Labs & Diagnostic Centers:**\n• QuickLab Diagnostics - 0.8km\n• MediTest Center - 1.5km\n• City Lab Services - 2.1km\n\n🏥 **Hospitals:**\n• Muhimbili Hospital - 3.2km\n• Aga Khan Hospital - 4.1km`,
      timestamp: new Date(),
      suggestions: ['Get directions', 'Check pharmacy stock', 'Book lab appointment', 'Call pharmacy'],
      category: 'general'
    };
  };

  const getPharmacistChatResponse = (query: string): Message => {
    const responses = {
      'interaction': 'Drug interactions can be serious. Always inform your pharmacist about all medications you\'re taking, including supplements.',
      'side effects': 'Common side effects vary by medication. If you experience unusual symptoms, contact your pharmacist or doctor immediately.',
      'dosage': 'Never adjust medication dosages without consulting your healthcare provider. Proper timing and dosage are crucial for effectiveness.',
      'storage': 'Store medications in a cool, dry place away from direct sunlight. Some medications require refrigeration - check the label.'
    };

    const responseKey = Object.keys(responses).find(key => query.toLowerCase().includes(key));
    const advice = responseKey ? responses[responseKey as keyof typeof responses] : 
      'I\'d be happy to help with your medication question. For specific medical advice, please consult with a licensed pharmacist or your healthcare provider.';

    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `👨‍⚕️ **Pharmacist Consultation**\n\n${advice}\n\n⚠️ **Important**: This is general guidance. For personalized advice about your specific medications, please visit your local pharmacy or consult your healthcare provider.`,
      timestamp: new Date(),
      suggestions: ['Drug interactions', 'Side effects', 'Proper storage', 'Dosage timing'],
      category: 'medical'
    };
  };

  // Retail Pharmacy Features
  const getInventoryInsightsResponse = (): Message => {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `📊 **Weekly Inventory Insights**\n\n⚠️ **Low Stock Alerts (5 items):**\n• Paracetamol 500mg - 45 units left\n• Amoxicillin 250mg - 28 units left\n• Insulin - 12 units left\n\n🔥 **Top Sellers This Week:**\n1. Vitamin C (180 sold)\n2. Paracetamol (145 sold)\n3. Cough Syrup (89 sold)\n\n📈 **Revenue Impact:**\n• Weekly sales: TZS 2,450,000\n• Profit margin: 28.5%`,
      timestamp: new Date(),
      suggestions: ['Restock recommendations', 'View detailed analytics', 'Generate reorder list', 'Sales forecast'],
      category: 'inventory'
    };
  };

  const getRestockSuggestionResponse = (): Message => {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `🔄 **Smart Restock Suggestions**\n\n**Immediate Action Needed:**\n• Insulin - Order 50 units (3-day supply left)\n• Paracetamol - Order 200 units (high demand)\n\n**Recommended Orders:**\n• Amoxicillin - 100 units (TZS 45,000)\n• Vitamin C - 150 units (TZS 22,500)\n• Blood pressure meds - 80 units (TZS 96,000)\n\n💰 **Total Order Value:** TZS 163,500\n⏱️ **Expected ROI:** 35% over 2 weeks`,
      timestamp: new Date(),
      suggestions: ['Generate purchase order', 'Contact suppliers', 'Set auto-reorder', 'View supplier prices'],
      category: 'inventory'
    };
  };

  const getOrderSummaryResponse = (): Message => {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `📋 **Order Summary**\n\n**Today's Orders:**\n• 15 new orders (TZS 340,000)\n• 12 fulfilled orders\n• 3 pending fulfillment\n\n**Active Prescriptions:**\n• 8 ready for pickup\n• 5 in preparation\n• 2 awaiting doctor confirmation\n\n**Recent Activity:**\n• Customer #1245 - Diabetes kit pickup\n• Customer #1246 - Antibiotic prescription\n• Customer #1247 - Vitamin order delivered`,
      timestamp: new Date(),
      suggestions: ['View pending orders', 'Print pickup list', 'Contact customers', 'Update order status'],
      category: 'order'
    };
  };

  const getInvoiceGeneratorResponse = (): Message => {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `🧾 **Quick Invoice Generator**\n\n**Sample Invoice #INV-2024-0156**\n\n**Items:**\n• Paracetamol 500mg x10 - TZS 12,000\n• Vitamin C x5 - TZS 8,500\n• Consultation fee - TZS 5,000\n\n**Subtotal:** TZS 25,500\n**Tax (18%):** TZS 4,590\n**Total:** TZS 30,090\n\n**Payment Method:** Cash\n**Status:** Paid`,
      timestamp: new Date(),
      suggestions: ['Print invoice', 'Send via SMS', 'Email to customer', 'Generate new invoice'],
      category: 'business'
    };
  };

  // Wholesale Features
  const getBulkOrderAssistantResponse = (): Message => {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `📦 **Bulk Order Assistant**\n\n**Based on your recent orders, I recommend:**\n\n**High Priority:**\n• Paracetamol 500mg - 5,000 units (TZS 125,000)\n• Amoxicillin 250mg - 2,000 units (TZS 90,000)\n\n**Medium Priority:**\n• Vitamin supplements - 3,000 units (TZS 45,000)\n• Cough medications - 1,500 units (TZS 60,000)\n\n**Bulk Discount Available:**\n• Orders >TZS 300,000 get 8% discount\n• Free delivery for orders >TZS 500,000`,
      timestamp: new Date(),
      suggestions: ['Create purchase order', 'View supplier catalogs', 'Check bulk discounts', 'Schedule delivery'],
      category: 'business'
    };
  };

  const getProfitabilityResponse = (): Message => {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `💰 **Profitability Snapshot**\n\n**This Month's Performance:**\n• Total Revenue: TZS 12,500,000\n• Cost of Goods: TZS 8,750,000\n• Gross Profit: TZS 3,750,000\n• Profit Margin: 30%\n\n**Top Profit Generators:**\n1. Generic medications (42% margin)\n2. Vitamins & supplements (38% margin)\n3. Health devices (35% margin)\n\n**Improvement Opportunities:**\n• Increase generic substitution rate\n• Optimize pricing on slow-moving items`,
      timestamp: new Date(),
      suggestions: ['Detailed P&L report', 'Product profitability', 'Cost optimization', 'Pricing strategy'],
      category: 'business'
    };
  };

  // Lab Features
  const getTestRoutingResponse = (symptoms: string): Message => {
    const testRecommendations = {
      'diabetes': ['HbA1c', 'Fasting Blood Glucose', 'Random Blood Sugar'],
      'heart': ['Lipid Profile', 'ECG', 'Cardiac Enzymes'],
      'kidney': ['Creatinine', 'BUN', 'Urinalysis'],
      'liver': ['ALT', 'AST', 'Bilirubin'],
      'infection': ['Complete Blood Count', 'ESR', 'CRP']
    };

    const symptomKey = Object.keys(testRecommendations).find(key => 
      symptoms.toLowerCase().includes(key)
    );

    const tests = symptomKey ? testRecommendations[symptomKey as keyof typeof testRecommendations] : 
      ['Complete Blood Count', 'Basic Metabolic Panel', 'Urinalysis'];

    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `🔬 **Smart Test Routing**\n\nBased on the symptoms mentioned, I recommend:\n\n**Primary Tests:**\n${tests.map(test => `• ${test}`).join('\n')}\n\n**Available Slots:**\n• Today 2:00 PM - 4:00 PM\n• Tomorrow 9:00 AM - 11:00 AM\n• Saturday 10:00 AM - 12:00 PM\n\n💰 **Package Price:** TZS 45,000\n⏱️ **Results Ready:** 24-48 hours`,
      timestamp: new Date(),
      suggestions: ['Book appointment', 'Add more tests', 'View test details', 'Check insurance coverage'],
      category: 'lab'
    };
  };

  const getAppointmentManagerResponse = (): Message => {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `📅 **Appointment Manager**\n\n**Today's Schedule:**\n• 9:00 AM - John Doe (Blood test)\n• 10:30 AM - Mary Smith (X-ray)\n• 2:00 PM - Available slot\n• 3:30 PM - Peter Johnson (ECG)\n\n**Upcoming:**\n• Tomorrow: 12 appointments\n• This week: 68 appointments\n\n**Quick Actions Available:**\n• Reschedule appointments\n• Send reminder messages\n• Update test results`,
      timestamp: new Date(),
      suggestions: ['View full schedule', 'Send reminders', 'Block time slots', 'Generate reports'],
      category: 'appointment'
    };
  };

  const getReferralGeneratorResponse = (): Message => {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `📄 **Medical Referral Generator**\n\n**Sample Referral Letter**\n\nPatient: John Doe (ID: 12345)\nDate: ${new Date().toLocaleDateString()}\n\n**Test Results Summary:**\n• Blood Glucose: 180 mg/dL (High)\n• HbA1c: 8.2% (Elevated)\n\n**Recommendation:**\nRefer to Endocrinologist for diabetes management and treatment optimization.\n\n**Urgency:** Routine (within 2 weeks)\n**Additional Notes:** Patient requires dietary counseling`,
      timestamp: new Date(),
      suggestions: ['Print referral', 'Send to doctor', 'Schedule follow-up', 'Generate another'],
      category: 'lab'
    };
  };

  const getSymptomCheckResponse = (symptoms: string): Message => {
    const commonSymptoms = {
      'fever': {
        advice: 'Fever can indicate infection. Monitor temperature, stay hydrated, and rest. Seek medical attention if fever exceeds 39°C (102°F) or persists.',
        urgency: 'moderate',
        suggestions: ['Find nearby pharmacies', 'Consult a doctor', 'Medicine for fever']
      },
      'headache': {
        advice: 'Headaches can have various causes. Ensure adequate hydration, rest in a quiet environment. Persistent or severe headaches warrant medical consultation.',
        urgency: 'low',
        suggestions: ['Pain relief medicines', 'Relaxation techniques', 'When to see a doctor']
      },
      'cough': {
        advice: 'Coughs can be due to infections, allergies, or other conditions. Stay hydrated, consider honey for throat soothing. Persistent cough needs medical evaluation.',
        urgency: 'moderate',
        suggestions: ['Cough medicines', 'Home remedies', 'Chest X-ray locations']
      },
      'chest pain': {
        advice: '⚠️ Chest pain can be serious. If you experience severe chest pain, difficulty breathing, or pain radiating to arms/jaw, seek immediate medical attention.',
        urgency: 'high',
        suggestions: ['Find emergency services', 'Call ambulance', 'Nearest hospital']
      }
    };

    const symptomKey = Object.keys(commonSymptoms).find(key => 
      symptoms.toLowerCase().includes(key)
    );

    if (symptomKey) {
      const symptomInfo = commonSymptoms[symptomKey as keyof typeof commonSymptoms];
      return {
        id: Date.now().toString(),
        type: 'bot',
        content: `🩺 **Symptom Assessment: ${symptomKey.charAt(0).toUpperCase() + symptomKey.slice(1)}**\n\n${symptomInfo.advice}\n\n⚠️ **Important**: This is general guidance only. Always consult healthcare professionals for proper diagnosis and treatment.`,
        timestamp: new Date(),
        suggestions: symptomInfo.suggestions,
        category: 'symptom'
      };
    }

    return {
      id: Date.now().toString(),
      type: 'bot',
      content: '🩺 I understand you\'re experiencing symptoms. While I can provide general guidance, it\'s important to consult with healthcare professionals for proper diagnosis. Would you like me to help you find nearby healthcare providers or pharmacies?',
      timestamp: new Date(),
      suggestions: ['Find nearby doctors', 'Locate pharmacies', 'Emergency services', 'Book lab tests'],
      category: 'symptom'
    };
  };

  const getLabResultInterpretation = (query: string): Message => {
    const labTests = {
      'blood glucose': {
        normal: 'Normal fasting glucose: 70-99 mg/dL',
        interpretation: 'Blood glucose levels indicate how well your body processes sugar. Elevated levels may suggest diabetes risk.',
        ranges: 'Normal: <100 mg/dL | Prediabetes: 100-125 mg/dL | Diabetes: ≥126 mg/dL'
      },
      'cholesterol': {
        normal: 'Total cholesterol should be <200 mg/dL',
        interpretation: 'Cholesterol levels help assess cardiovascular risk. Higher levels may require dietary changes or medication.',
        ranges: 'Desirable: <200 mg/dL | Borderline: 200-239 mg/dL | High: ≥240 mg/dL'
      },
      'hemoglobin': {
        normal: 'Normal Hb: Men 13.5-17.5 g/dL, Women 12.0-15.5 g/dL',
        interpretation: 'Hemoglobin carries oxygen in your blood. Low levels may indicate anemia.',
        ranges: 'Low: <12 g/dL (women), <13.5 g/dL (men) | Normal: See above | High: >15.5 g/dL (women), >17.5 g/dL (men)'
      }
    };

    // Enhanced: Parse pasted/uploaded result values
    const lines = query.split('\n').map(l => l.trim()).filter(Boolean);
    let foundAny = false;
    let response = '';
    lines.forEach(line => {
      const [test, value] = line.split(':').map(s => s.trim());
      if (test && value) {
        const key = Object.keys(labTests).find(k => test.toLowerCase().includes(k));
        if (key) {
          foundAny = true;
          const t = labTests[key as keyof typeof labTests];
          response += `**${test}**: ${value}\n- Normal: ${t.normal}\n- Meaning: ${t.interpretation}\n- Reference: ${t.ranges}\n\n`;
        } else {
          response += `**${test}**: ${value}\n- (No reference found. Please consult your doctor for interpretation.)\n\n`;
        }
      }
    });
    if (foundAny) {
      return {
        id: Date.now().toString(),
        type: 'bot',
        content: `🔬 **Lab Result Interpretation**\n\n${response}\n⚠️ **Note**: Always discuss results with your healthcare provider for personalized interpretation.`,
        timestamp: new Date(),
        suggestions: ['Book follow-up test', 'Find specialist', 'Lifestyle recommendations', 'More lab tests'],
        category: 'lab'
      };
    }
    // Fallback for unknown or unparseable
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: '🔬 I can help interpret common lab test results including blood glucose, cholesterol, hemoglobin, liver function, and more. Please specify which test result you\'d like me to explain, or upload your lab report for detailed interpretation. If your test is not recognized, please consult your healthcare provider.',
      timestamp: new Date(),
      suggestions: ['Blood glucose', 'Cholesterol levels', 'Complete blood count', 'Liver function'],
      category: 'lab'
    };
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Update conversation context
    setConversationContext(prev => ({
      ...prev,
      lastTopic: messageContent.toLowerCase().includes('medication') ? 'medication' :
                messageContent.toLowerCase().includes('symptom') ? 'symptom' :
                messageContent.toLowerCase().includes('inventory') ? 'inventory' : 'general'
    }));

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse = getBotResponse(messageContent);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);

      // Schedule follow-up for certain topics
      if (botResponse.category === 'medication' || botResponse.category === 'symptom') {
        setTimeout(() => {
          const followUpMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: `💭 Just checking - do you need any additional help with ${botResponse.category === 'medication' ? 'your medications' : 'your symptoms'}? I'm here if you have more questions!`,
            timestamp: new Date(),
            suggestions: ['I\'m all set', 'Yes, I have questions', 'Schedule reminder'],
            category: 'general',
            isFollowUp: true
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 30000); // Follow up after 30 seconds
      }
    }, 1000);
  };

  const getBotResponse = (userMessage: string): Message => {
    const message = userMessage.toLowerCase();
    
    // Role-specific advanced features
    if (user?.role === 'individual') {
      if (message.includes('medication') || message.includes('pill') || message.includes('track')) {
        return getMedicationTrackerResponse(message);
      }
      if (message.includes('nearby') || message.includes('pharmacy') || message.includes('location')) {
        return getNearbyServicesResponse();
      }
      if (message.includes('pharmacist') || message.includes('ask') || message.includes('question')) {
        return getPharmacistChatResponse(message);
      }
      if (message.includes('symptom') || message.includes('pain') || message.includes('fever') || 
          message.includes('headache') || message.includes('cough') || message.includes('sick')) {
        return getSymptomCheckResponse(message);
      }
    }
    
    if (user?.role === 'retail') {
      if (message.includes('inventory') || message.includes('stock') || message.includes('insight')) {
        return getInventoryInsightsResponse();
      }
      if (message.includes('restock') || message.includes('reorder') || message.includes('suggestion')) {
        return getRestockSuggestionResponse();
      }
      if (message.includes('order') || message.includes('summary') || message.includes('customer')) {
        return getOrderSummaryResponse();
      }
      if (message.includes('invoice') || message.includes('generate') || message.includes('receipt')) {
        return getInvoiceGeneratorResponse();
      }
    }
    
    if (user?.role === 'wholesale') {
      if (message.includes('bulk') || message.includes('order') || message.includes('purchase')) {
        return getBulkOrderAssistantResponse();
      }
      if (message.includes('profit') || message.includes('margin') || message.includes('financial')) {
        return getProfitabilityResponse();
      }
    }
    
    if (user?.role === 'lab') {
      if (message.includes('test') || message.includes('recommend') || message.includes('symptom')) {
        return getTestRoutingResponse(message);
      }
      if (message.includes('appointment') || message.includes('schedule') || message.includes('booking')) {
        return getAppointmentManagerResponse();
      }
      if (message.includes('referral') || message.includes('letter') || message.includes('doctor')) {
        return getReferralGeneratorResponse();
      }
      if (message.includes('result') || message.includes('interpret') || message.includes('blood')) {
        return getLabResultInterpretation(message);
      }
    }

    // General responses for existing functionality
    if (message.includes('hello') || message.includes('hi')) {
      return {
        id: Date.now().toString(),
        type: 'bot',
        content: "Hello! 👋 Great to see you here. I'm constantly learning to better assist you. What would you like to explore today?",
        timestamp: new Date(),
        suggestions: user?.role === 'individual' ? 
          ['Track medications', 'Find services', 'Check symptoms'] :
          user?.role === 'retail' ?
          ['Inventory insights', 'Order summary', 'Generate invoice'] :
          user?.role === 'wholesale' ?
          ['Bulk orders', 'Profit analysis', 'Market trends'] :
          user?.role === 'lab' ?
          ['Recommend tests', 'Manage appointments', 'Generate referral'] :
          ['Platform features', 'Getting started'],
        category: 'general'
      };
    }

    // Default response with enhanced suggestions
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: "I'm here to help with a wide range of tasks! 🤖 I've been enhanced with new capabilities specific to your role. Try asking me about the suggestions below or describe what you need assistance with.",
      timestamp: new Date(),
      suggestions: user?.role === 'individual' ? 
        ['Track my medications', 'Find nearby services', 'Ask a pharmacist', 'Check symptoms'] :
        user?.role === 'retail' ?
        ['Show inventory insights', 'Restock suggestions', 'Order summary', 'Generate invoice'] :
        user?.role === 'wholesale' ?
        ['Bulk order planning', 'Profitability analysis', 'Distributor support'] :
        user?.role === 'lab' ?
        ['Recommend tests', 'Appointment schedule', 'Generate referral', 'Interpret results'] :
        ['Platform overview', 'User management', 'System status'],
      category: 'general'
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'medical':
      case 'symptom':
        return <Stethoscope className="h-4 w-4" />;
      case 'business':
        return <TrendingUp className="h-4 w-4" />;
      case 'lab':
        return <FileText className="h-4 w-4" />;
      case 'medication':
        return <Pill className="h-4 w-4" />;
      case 'inventory':
        return <Calculator className="h-4 w-4" />;
      case 'order':
        return <Users className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
        <div className="absolute -top-3 -right-1 bg-orange-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
          <HelpCircle className="h-3 w-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw]">
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">BEPAWA AI Assistant</CardTitle>
                <p className="text-sm text-white/80">
                  {user?.role === 'individual' ? 'Personal Health & Medication Assistant' :
                   user?.role === 'retail' ? 'Smart Pharmacy Business Assistant' :
                   user?.role === 'wholesale' ? 'Wholesale Operations Assistant' :
                   user?.role === 'lab' ? 'Smart Lab Management Assistant' : 'Healthcare Platform Assistant'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-80 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                    <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-primary-100 ml-2' : 'bg-gray-100 mr-2'}`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-primary-600" />
                      ) : (
                        getCategoryIcon(message.category)
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className={`p-3 rounded-lg ${
                        message.type === 'user' 
                          ? 'bg-primary-600 text-white' 
                          : message.category === 'symptom' 
                          ? 'bg-red-50 text-red-900 border border-red-200'
                          : message.category === 'business' || message.category === 'inventory'
                          ? 'bg-blue-50 text-blue-900 border border-blue-200'
                          : message.category === 'lab' || message.category === 'appointment'
                          ? 'bg-purple-50 text-purple-900 border border-purple-200'
                          : message.category === 'medication'
                          ? 'bg-green-50 text-green-900 border border-green-200'
                          : message.isFollowUp
                          ? 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                      </div>
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-primary-50 hover:border-primary-300 transition-colors"
                              onClick={() => handleSendMessage(suggestion)}
                            >
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start space-x-2">
                  <div className="bg-gray-100 p-2 rounded-full mr-2">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  user?.role === 'individual' ? "Track meds, check symptoms, find services..." :
                  user?.role === 'retail' ? "Inventory insights, orders, invoices..." :
                  user?.role === 'wholesale' ? "Bulk orders, profits, distribution..." :
                  user?.role === 'lab' ? "Test routing, appointments, referrals..." :
                  "Ask me anything about BEPAWA..."
                }
                className="flex-1 border-gray-200 focus:border-primary-500 focus:ring-primary-500"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Enhanced AI assistant with role-specific features • Always consult professionals for medical decisions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatBot;
