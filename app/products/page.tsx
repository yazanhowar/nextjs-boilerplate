'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import LangToggle from '../../components/LangToggle'
import { useLang } from '../../lib/LangContext'

type Bank = { id: number; name_en: string; short_name: string; name_ar: string; short_name_ar: string; bank_type: string; slug: string }
type Product = { id: number; bank_id: number; category: string; sub_category: string; product_name_en: string; description_en: string; is_islamic: boolean; sharia_structure: string; target_segment: string; source_url: string }

const SECTORS = [
  { key: 'retail',    label: 'Retail',    labelAr: 'التجزئة',            icon: '👤', desc: 'Individual customers',        descAr: 'عملاء الأفراد' },
  { key: 'premium',  label: 'Premium',   labelAr: 'المميز',             icon: '⭐', desc: 'High-net-worth & VIP',        descAr: 'العملاء المميزون' },
  { key: 'sme',      label: 'SME',       labelAr: 'المنشآت الصغيرة',    icon: '🏪', desc: 'Small & medium enterprises',  descAr: 'الشركات الصغيرة والمتوسطة' },
  { key: 'corporate',label: 'Corporate', labelAr: 'الشركات',            icon: '🏢', desc: 'Large corporations',           descAr: 'الشركات الكبرى' },
]

const SECTOR_CATEGORIES: Record<string, { key: string; label: string; labelAr: string }[]> = {
  retail: [
    { key: 'retail_deposit', label: 'Accounts & Deposits', labelAr: 'الحسابات والودائع' },
    { key: 'retail_card',    label: 'Cards',               labelAr: 'البطاقات' },
    { key: 'retail_loan',    label: 'Loans',               labelAr: 'القروض' },
    { key: 'digital',        label: 'Digital Services',    labelAr: 'الخدمات الرقمية' },
    { key: 'insurance',      label: 'Insurance',           labelAr: 'التأمين' },
    { key: 'other',          label: 'Programs & Other',    labelAr: 'البرامج وأخرى' },
  ],
  premium: [
    { key: 'retail_card',    label: 'Premium Cards',       labelAr: 'البطاقات المميزة' },
    { key: 'other',          label: 'Premium Programs',    labelAr: 'البرامج المميزة' },
    { key: 'investment',     label: 'Investment & Wealth', labelAr: 'الاستثمار وإدارة الثروات' },
    { key: 'retail_deposit', label: 'Premium Accounts',   labelAr: 'الحسابات المميزة' },
  ],
  sme: [
    { key: 'corporate_loan', label: 'SME Financing',       labelAr: 'تمويل المنشآت الصغيرة' },
    { key: 'digital',        label: 'Digital Banking',     labelAr: 'الخدمات الرقمية' },
  ],
  corporate: [
    { key: 'corporate_loan', label: 'Corporate Finance',   labelAr: 'التمويل المؤسسي' },
    { key: 'investment',     label: 'Investment & Treasury',labelAr: 'الاستثمار والخزينة' },
    { key: 'digital',        label: 'Corporate Digital',   labelAr: 'الخدمات الرقمية للشركات' },
    { key: 'other',          label: 'Other Services',      labelAr: 'خدمات أخرى' },
  ],
}

type Feature = { key: string; label: string; labelAr: string; match: (p: Product) => boolean }

const FEATURES: Record<string, Feature[]> = {
  'retail_retail_deposit': [
    { key:'current',      label:'Current Account',           labelAr:'حساب جاري',            match: p => p.sub_category==='current' && !p.product_name_en.toLowerCase().includes('basic') && !['salary','salari'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'salary',       label:'Salary Account',            labelAr:'حساب الراتب',           match: p => p.sub_category==='current' && ['salary','salari'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'basic',        label:'Basic Bank Account',        labelAr:'حساب بنكي أساسي',       match: p => p.product_name_en.toLowerCase().includes('basic') },
    { key:'savings',      label:'Standard Savings Account',  labelAr:'حساب توفير',            match: p => p.sub_category==='savings' && !['prize','tawfeer','tharaa','gold road','women','kanzy','sumu','bright','xceed','smart saver','offset','mustaqbaly','sanabel','junior','premier','precious','expat','digital bank','family'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'prize',        label:'Prize-Linked Savings',      labelAr:'ادخار بجوائز',          match: p => p.sub_category==='savings' && ['prize','tawfeer','tharaa','gold road','main savings'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'td',           label:'Time Deposit',              labelAr:'وديعة آجلة',            match: p => p.sub_category==='time_deposit' },
    { key:'cd',           label:'Certificate of Deposit',    labelAr:'شهادة إيداع',           match: p => p.product_name_en.toLowerCase().includes('certificate') },
    { key:'youth',        label:'Youth / Kids Account',      labelAr:'حساب الأطفال والشباب',  match: p => ['kid','youth','junior','mustaqbaly','kanzy','sumu','bright','xceed','sanabel'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'women_acc',    label:"Women's Account",           labelAr:'حساب المرأة',           match: p => ['women','anty','harir'].some(k=>p.product_name_en.toLowerCase().includes(k)) && p.category==='retail_deposit' },
    { key:'gold_acc',     label:'Precious Metals / Gold',    labelAr:'ادخار المعادن الثمينة', match: p => ['precious','gold account'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'digital_acc',  label:'Digital Account Opening',   labelAr:'فتح حساب رقمي',         match: p => ['digital bank account','digital onboarding'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'expat',        label:'Expat Account',             labelAr:'حساب المغترب',          match: p => p.product_name_en.toLowerCase().includes('expat') },
  ],
  'retail_retail_card': [
    { key:'classic',      label:'Classic Credit Card',       labelAr:'بطاقة كلاسيك',          match: p => p.sub_category==='credit_card' && p.product_name_en.toLowerCase().includes('classic') },
    { key:'gold',         label:'Gold Credit Card',          labelAr:'بطاقة ذهبية',           match: p => p.sub_category==='credit_card' && p.product_name_en.toLowerCase().includes('gold') && !['elite','road'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'titanium',     label:'Titanium Credit Card',      labelAr:'بطاقة تيتانيوم',        match: p => p.sub_category==='credit_card' && p.product_name_en.toLowerCase().includes('titanium') },
    { key:'platinum',     label:'Platinum Credit Card',      labelAr:'بطاقة بلاتينية',        match: p => p.sub_category==='credit_card' && p.product_name_en.toLowerCase().includes('platinum') && !['foreign','eur'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'world',        label:'World / Signature Card',    labelAr:'بطاقة ورلد / سيغنيتشر', match: p => p.sub_category==='credit_card' && (p.product_name_en.toLowerCase().includes('world') || p.product_name_en.toLowerCase().includes('signature')) && !['elite','infinite','metal'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'cobrand',      label:'Co-branded / Miles Card',   labelAr:'بطاقة مشتركة / أميال',  match: p => p.sub_category==='credit_card' && ['miles','fly & plus','royal jordanian','together','travel mate','shop & ship'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'debit',        label:'Debit Card',                labelAr:'بطاقة الخصم',           match: p => p.sub_category==='debit_card' && p.target_segment==='retail' },
    { key:'prepaid',      label:'Prepaid Card',              labelAr:'بطاقة مدفوعة مسبقاً',   match: p => p.sub_category==='prepaid' },
    { key:'wearable',     label:'Wearable Payment',          labelAr:'دفع بالإكسسوار',         match: p => ['bracelet','band','sticker','wearable'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'virtual',      label:'Virtual Card',              labelAr:'بطاقة افتراضية',        match: p => ['v-card','virtual'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'fx_card',      label:'Foreign Currency Card',     labelAr:'بطاقة العملات الأجنبية',match: p => p.sub_category==='credit_card' && ['foreign currency','multi-currency'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
  ],
  'retail_retail_loan': [
    { key:'personal',     label:'Personal Loan',             labelAr:'قرض شخصي',              match: p => p.sub_category==='personal_loan' && !['instant','army','doctor','profession','advance','salary','cash to','abj'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'home',         label:'Home / Mortgage Loan',      labelAr:'قرض سكني',              match: p => p.sub_category==='home_loan' && !['land','material','under construct','equity','apartment first'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'car',          label:'Auto Loan',                 labelAr:'قرض سيارة',             match: p => p.sub_category==='car_loan' },
    { key:'instant',      label:'Instant / App-based Loan',  labelAr:'قرض فوري',              match: p => p.product_name_en.toLowerCase().includes('instant') },
    { key:'salary_adv',   label:'Salary Advance',            labelAr:'سلفة راتب',             match: p => ['advance salary','salary advance'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'army',         label:'Army / Forces Loan',        labelAr:'قرض عسكري',             match: p => p.product_name_en.toLowerCase().includes('army') },
    { key:'doctor',       label:'Doctors Loan',              labelAr:'قرض الأطباء',           match: p => ['doctor','md','clinic owner','tabeeb'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'land',         label:'Land Financing',            labelAr:'تمويل أرض',             match: p => p.product_name_en.toLowerCase().includes('land') && p.sub_category==='home_loan' },
    { key:'edu',          label:'Education / University',    labelAr:'قرض تعليمي',            match: p => p.sub_category==='education' || p.product_name_en.toLowerCase().includes('universit') },
    { key:'purchase',     label:'0% Purchase Installment',   labelAr:'تقسيط مشتريات 0%',      match: p => p.sub_category==='purchase_finance' },
    { key:'abj',          label:'ABJ Initiative (4.99%)',    labelAr:'مبادرة جمعية البنوك 4.99%', match: p => p.product_name_en.toLowerCase().includes('abj') },
    { key:'apartment',    label:'Apartment First Timer',     labelAr:'شقة أول مرة',           match: p => p.product_name_en.toLowerCase().includes('first timer') },
  ],
  'retail_digital': [
    { key:'mobile',       label:'Mobile Banking App',        labelAr:'تطبيق موبايل',          match: p => p.sub_category==='mobile_banking' && p.target_segment==='retail' },
    { key:'online',       label:'Internet Banking',          labelAr:'إنترنت بنكنج',          match: p => p.sub_category==='online_banking' && p.target_segment==='retail' },
    { key:'cliq',         label:'CliQ Instant Payment',      labelAr:'كليك للدفع الفوري',      match: p => p.product_name_en.toLowerCase().includes('cliq') && p.target_segment==='retail' },
    { key:'apple',        label:'Apple Pay',                 labelAr:'آبل باي',               match: p => p.product_name_en.toLowerCase().includes('apple pay') },
    { key:'google',       label:'Google Pay',                labelAr:'جوجل باي',              match: p => p.product_name_en.toLowerCase().includes('google pay') },
    { key:'efawateer',    label:'eFAWATEERcom',              labelAr:'الفواتير الإلكترونية',   match: p => p.product_name_en.toLowerCase().includes('fawateer') },
    { key:'paypal',       label:'PayPal Integration',        labelAr:'باي بال',               match: p => p.product_name_en.toLowerCase().includes('paypal') },
    { key:'cardless',     label:'Cardless ATM Withdrawal',   labelAr:'سحب بدون بطاقة',        match: p => p.product_name_en.toLowerCase().includes('cardless') },
    { key:'itm',          label:'ITM / Smart ATM',           labelAr:'صراف ذكي',              match: p => p.sub_category==='atm' || p.product_name_en.toLowerCase().includes('itm') },
    { key:'visa_direct',  label:'Visa Direct / Remittance',  labelAr:'تحويل فيزا دايركت',     match: p => p.product_name_en.toLowerCase().includes('visa direct') },
    { key:'dig_finance',  label:'Digital Financing (App)',   labelAr:'تمويل رقمي',            match: p => p.product_name_en.toLowerCase().includes('digital financing') },
  ],
  'retail_insurance': [
    { key:'life',         label:'Life Insurance',            labelAr:'تأمين الحياة',          match: p => p.category==='insurance' && p.product_name_en.toLowerCase().includes('life') },
    { key:'general',      label:'General Insurance',         labelAr:'تأمين عام',             match: p => p.category==='insurance' && p.product_name_en.toLowerCase().includes('general') },
    { key:'critical',     label:'Critical Illness',          labelAr:'أمراض خطرة',            match: p => p.category==='insurance' && p.product_name_en.toLowerCase().includes('critical') },
    { key:'edu_ins',      label:'Education Plan',            labelAr:'خطة تعليمية',           match: p => p.category==='insurance' && p.product_name_en.toLowerCase().includes('education') },
    { key:'retirement',   label:'Retirement Plan',           labelAr:'خطة تقاعد',             match: p => p.category==='insurance' && p.product_name_en.toLowerCase().includes('retirement') },
    { key:'property',     label:'House / Property Insurance',labelAr:'تأمين المنزل',          match: p => p.category==='insurance' && ['house','home insurance','office'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'accident',     label:'Personal Accident',         labelAr:'حوادث شخصية',           match: p => p.category==='insurance' && p.product_name_en.toLowerCase().includes('accident') },
    { key:'financial_sec',label:'Financial Security / Savings+Insurance', labelAr:'الحماية المالية', match: p => p.category==='insurance' && ['financial security','success','sanctuary','hayati'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
  ],
  'retail_other': [
    { key:'loyalty',      label:'Loyalty / Rewards Program', labelAr:'برنامج ولاء / مكافآت',  match: p => p.sub_category==='loyalty' || ['reward','points','coins'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'safe_box',     label:'Safe Deposit Boxes',        labelAr:'صناديق الأمانات',       match: p => ['safe deposit','safe store'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'remittance',   label:'Western Union / MoneyGram', labelAr:'تحويلات',               match: p => ['western union','moneygram','telemoney'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'green_ret',    label:'Green / Sustainability',    labelAr:'منتجات مستدامة',        match: p => ['ecolytiq','carbon','sustainab'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'youth_prog',   label:'Youth Banking Program',     labelAr:'برنامج الشباب',         match: p => p.sub_category==='program' && ['youth','young','junior','shabab'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'women_prog',   label:"Women's Banking Program",   labelAr:'برنامج المرأة',         match: p => p.sub_category==='program' && ['anty','women program'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'open_banking', label:'Open Banking / API',        labelAr:'الخدمات المفتوحة',      match: p => p.product_name_en.toLowerCase().includes('open banking') },
    { key:'dig_sub',      label:'Digital Bank Subsidiary',   labelAr:'بنك رقمي تابع',         match: p => p.sub_category==='digital_bank' || ['signature cab','ila digital'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
  ],
  'premium_retail_card': [
    { key:'signature',    label:'Visa Signature / World Elite',labelAr:'فيزا سيغنيتشر / ورلد إيليت', match: p => p.sub_category==='credit_card' && p.target_segment==='premium' && (p.product_name_en.toLowerCase().includes('signature') || p.product_name_en.toLowerCase().includes('world elite')) },
    { key:'infinite_jod', label:'Visa Infinite (JOD)',        labelAr:'فيزا إنفينيت دينار',         match: p => p.sub_category==='credit_card' && p.target_segment==='premium' && p.product_name_en.toLowerCase().includes('infinite') && !['dollar','foreign','metal'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'infinite_fx',  label:'Visa Infinite (USD/FX)',     labelAr:'فيزا إنفينيت دولار',         match: p => p.sub_category==='credit_card' && p.target_segment==='premium' && ['infinite dollar','infinite foreign','world elite biometric'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'metal',        label:'Metal Card',                 labelAr:'بطاقة معدنية',               match: p => p.sub_category==='credit_card' && p.target_segment==='premium' && p.product_name_en.toLowerCase().includes('metal') },
    { key:'prem_debit',   label:'Premium Debit Card',         labelAr:'بطاقة خصم مميزة',            match: p => p.sub_category==='debit_card' && p.target_segment==='premium' },
  ],
  'premium_other': [
    { key:'private',      label:'Private / Prestige Banking', labelAr:'خدمات مصرفية خاصة',    match: p => p.target_segment==='premium' && ['private banking','prestige'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'edge',         label:'Edge / Select Program',      labelAr:'برنامج إيدج / سيلكت',  match: p => p.target_segment==='premium' && ['edge program','capital select','iskan plus'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'prime',        label:'Prime / Xclusive Program',   labelAr:'برنامج بريميوم / إكسكلوسيف', match: p => p.target_segment==='premium' && ['prime banking','xclusive','advantage'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'pearl',        label:'Pearl / VIP / JAH',          labelAr:'برنامج بيرل / كبار العملاء', match: p => p.target_segment==='premium' && ['pearl','jah','elevate'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'auto_safe',    label:'Auto Safe Deposit Boxes 24/7',labelAr:'صناديق أمانات آلية 24/7', match: p => p.product_name_en.toLowerCase().includes('auto safe') },
  ],
  'premium_investment': [
    { key:'wealth',       label:'Wealth Management',          labelAr:'إدارة الثروات',         match: p => p.sub_category==='wealth_management' },
    { key:'private_inv',  label:'Private Banking',            labelAr:'الخدمات الخاصة',        match: p => p.sub_category==='private_banking' },
    { key:'brokerage',    label:'Brokerage / Trading App',    labelAr:'وساطة / تداول',         match: p => p.sub_category==='brokerage' },
  ],
  'premium_retail_deposit': [
    { key:'premier',      label:'High-Yield Savings (4%+)',   labelAr:'توفير عالي العائد',      match: p => p.target_segment==='premium' && p.sub_category==='savings' },
    { key:'prem_td',      label:'Premium Time Deposit',       labelAr:'وديعة آجلة مميزة',      match: p => p.target_segment==='premium' && p.sub_category==='time_deposit' },
  ],
  'sme_corporate_loan': [
    { key:'direct_sme',   label:'Direct SME Loans',           labelAr:'قروض مباشرة',           match: p => p.target_segment==='sme' && ['direct loans','sme loan','sme financing','small business loan'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'women_sme',    label:"Women in Business",          labelAr:'المرأة في الأعمال',      match: p => p.target_segment==='sme' && ['women','anty'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'startup',      label:'Startup / New Business',     labelAr:'الشركات الناشئة',        match: p => p.target_segment==='sme' && ['startup','ibdaa','capital start'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'green_sme',    label:'Green / Renewable Energy',   labelAr:'التمويل الأخضر',        match: p => p.target_segment==='sme' && ['green','renewable','energy efficiency'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'trade_sme',    label:'Trade Finance (SME)',        labelAr:'تمويل تجاري للمنشآت',   match: p => p.target_segment==='sme' && p.sub_category==='trade_finance' },
    { key:'kafalah',      label:'Kafalah / Loan Guarantee',   labelAr:'برنامج كفالة',          match: p => p.product_name_en.toLowerCase().includes('kafalah') },
    { key:'eib',          label:'EIB Partnership Loans',      labelAr:'قروض البنك الأوروبي',   match: p => p.product_name_en.toLowerCase().includes('eib') },
    { key:'tourism_sme',  label:'Tourism / Markabati Loans',  labelAr:'قروض السياحة',          match: p => ['tourism','markabati'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'sme_bundle',   label:'SME Bundles / Packages',    labelAr:'حزم المنشآت',            match: p => p.target_segment==='sme' && ['bundle','package','tejari business'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'agri',         label:'Agricultural / IFAD',        labelAr:'التمويل الزراعي',       match: p => ['ifad','agricultur'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'pos_sme',      label:'POS Financing',              labelAr:'تمويل نقاط البيع',      match: p => p.target_segment==='sme' && p.product_name_en.toLowerCase().includes('point of sale') },
    { key:'sector_loans', label:'Sector Loans (food/home biz)',labelAr:'قروض قطاعية',          match: p => p.target_segment==='sme' && ['fast food','home based'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
  ],
  'sme_digital': [
    { key:'sme_platform', label:'SME Digital Platform',       labelAr:'منصة رقمية للمنشآت',   match: p => p.target_segment==='sme' },
  ],
  'corporate_corporate_loan': [
    { key:'corp_credit',  label:'Corporate Credit Facilities', labelAr:'تسهيلات ائتمانية',     match: p => p.target_segment==='corporate' && p.sub_category==='corporate_loan' && ['corporate','credit facilities','commercial loan','overdraft'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'syndicated',   label:'Syndicated Loans',            labelAr:'قروض مجمعة',           match: p => p.product_name_en.toLowerCase().includes('syndicated') },
    { key:'trade_corp',   label:'Trade Finance / LC',          labelAr:'تمويل تجاري / اعتمادات', match: p => p.target_segment==='corporate' && p.sub_category==='trade_finance' },
    { key:'project',      label:'Project Finance',             labelAr:'تمويل المشاريع',       match: p => ['project','contractors','structured'].some(k=>p.product_name_en.toLowerCase().includes(k)) && p.target_segment==='corporate' },
    { key:'supply_corp',  label:'Supply Chain Finance',        labelAr:'تمويل سلسلة الإمداد',  match: p => p.product_name_en.toLowerCase().includes('supply chain') },
    { key:'leasing',      label:'Leasing / Working Capital',   labelAr:'إيجار تمويلي / رأس مال عامل', match: p => ['fixed assets','working capital'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'guarantee',    label:'Letters of Guarantee',        labelAr:'خطابات ضمان',          match: p => p.target_segment==='corporate' && p.product_name_en.toLowerCase().includes('guarantee') },
  ],
  'corporate_investment': [
    { key:'treasury',     label:'Treasury / FX',              labelAr:'الخزينة والصرف الأجنبي', match: p => p.target_segment==='corporate' && (p.sub_category==='treasury' || p.sub_category==='fx') },
    { key:'sukuk',        label:'Sukuk / Capital Markets',    labelAr:'صكوك / أسواق المال',    match: p => ['sukuk','capital market','investment portfolio'].some(k=>p.product_name_en.toLowerCase().includes(k)) && p.target_segment==='corporate' },
    { key:'mudaraba',     label:'Mudaraba Investment',        labelAr:'استثمار المضاربة',      match: p => p.product_name_en.toLowerCase().includes('mudaraba') && p.target_segment==='corporate' },
    { key:'realestate',   label:'Real Estate Investment',     labelAr:'استثمار عقاري',        match: p => p.target_segment==='corporate' && p.sub_category==='investments' && p.product_name_en.toLowerCase().includes('real estate') },
  ],
  'corporate_digital': [
    { key:'corp_banking', label:'Corporate Online Banking',   labelAr:'بنكنج إلكتروني للشركات', match: p => p.target_segment==='corporate' && p.sub_category==='corporate_banking' && !['pos','softpos','gateway','collection'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'pos_corp',     label:'POS / SoftPOS / eCommerce', labelAr:'نقاط البيع والتجارة الإلكترونية', match: p => p.target_segment==='corporate' && ['pos','softpos','ecommerce','gateway'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'corp_card',    label:'Corporate Credit Cards',    labelAr:'بطاقات الشركات',        match: p => ['corporate card','visa corporate','corporate credit'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
    { key:'collection',   label:'Digital Collection',        labelAr:'التحصيل الرقمي',        match: p => p.product_name_en.toLowerCase().includes('collection') },
    { key:'open_api',     label:'Open Banking API',          labelAr:'الخدمات المصرفية المفتوحة', match: p => p.product_name_en.toLowerCase().includes('open banking') },
  ],
  'corporate_other': [
    { key:'intl',         label:'International Operations',  labelAr:'عمليات دولية',          match: p => p.target_segment==='corporate' && p.sub_category==='international' },
    { key:'subs',         label:'Subsidiaries / Group',      labelAr:'الشركات التابعة',        match: p => p.target_segment==='corporate' && p.sub_category==='subsidiaries' },
    { key:'fi',           label:'Financial Institutions',    labelAr:'المؤسسات المالية',       match: p => p.product_name_en.toLowerCase().includes('financial institution') },
    { key:'sme_portal',   label:'SME Portal / Advisory',    labelAr:'بوابة المنشآت الصغيرة',  match: p => p.target_segment==='corporate' && ['sme portal','advisory'].some(k=>p.product_name_en.toLowerCase().includes(k)) },
  ],
}

export default function ProductsPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  const [banks, setBanks] = useState<Bank[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSector, setActiveSector] = useState('retail')
  const [activeCategory, setActiveCategory] = useState('retail_deposit')
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from('banks').select('id,name_en,short_name,name_ar,short_name_ar,bank_type,slug').eq('is_active', true).order('name_en'),
      supabase.from('bank_products').select('*'),
    ]).then(([b, p]) => {
      setBanks(b.data || [])
      setProducts(p.data || [])
      setLoading(false)
    })
  }, [])

  const handleSectorChange = (sector: string) => {
    setActiveSector(sector)
    const cats = SECTOR_CATEGORIES[sector]
    if (cats?.length) setActiveCategory(cats[0].key)
    setHoveredCell(null)
  }

  const categories = SECTOR_CATEGORIES[activeSector] || []
  const featureKey = `${activeSector}_${activeCategory}`
  const features = FEATURES[featureKey] || []
  const bName = (b: Bank) => isAr ? (b.short_name_ar || b.name_ar || b.short_name) : b.short_name
  const activeSectorDef = SECTORS.find(s => s.key === activeSector)

  const getMatch = (bankId: number, feature: Feature) => {
    return products.find(p =>
      p.bank_id === bankId &&
      p.category === activeCategory &&
      p.target_segment === activeSector &&
      feature.match(p)
    ) || null
  }

  const sectorStats = useMemo(() =>
    SECTORS.reduce((acc, s) => { acc[s.key] = products.filter(p => p.target_segment === s.key).length; return acc }, {} as Record<string, number>)
  , [products])

  const hoveredProduct = useMemo(() => {
    if (!hoveredCell) return null
    const parts = hoveredCell.split('|||')
    if (parts.length !== 2) return null
    const [fKey, bId] = parts
    const feature = features.find(f => f.key === fKey)
    const bank = banks.find(b => b.id === parseInt(bId))
    if (!feature || !bank) return null
    const product = getMatch(parseInt(bId), feature)
    if (!product) return null
    return { product, bank }
  }, [hoveredCell, features, banks, products])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <header className="hbtf-header">
        <div>
          <div className="hbtf-logo-eyebrow">
            <a href="/">{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a>{' / '}{isAr ? 'مقارنة المنتجات' : 'Product Comparison'}
          </div>
          <div className="hbtf-logo-title">{isAr ? 'مقارنة المنتجات المصرفية' : 'Banking Product Comparison'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>← {isAr ? 'الرئيسية' : 'Dashboard'}</a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div style={{ padding: '1.75rem 2rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* Sector cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {SECTORS.map(s => (
            <button key={s.key} onClick={() => handleSectorChange(s.key)} style={{
              padding: '1rem', borderRadius: '10px', border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'start',
              borderColor: activeSector === s.key ? 'var(--accent)' : 'var(--border)',
              background: activeSector === s.key ? 'var(--accent-bg)' : 'var(--bg-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '99px', background: activeSector === s.key ? 'var(--accent)' : 'var(--border)', color: activeSector === s.key ? 'white' : 'var(--text-muted)' }}>
                  {sectorStats[s.key] || 0}
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: activeSector === s.key ? 'var(--accent)' : 'var(--text-primary)', marginBottom: '0.125rem' }}>{isAr ? s.labelAr : s.label}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{isAr ? s.descAr : s.desc}</div>
            </button>
          ))}
        </div>

        {/* Category sub-tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {categories.map(cat => (
            <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setHoveredCell(null) }} style={{
              padding: '0.4rem 0.875rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
              border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
              borderColor: activeCategory === cat.key ? 'var(--accent)' : 'var(--border)',
              background: activeCategory === cat.key ? 'var(--accent)' : 'var(--bg-card)',
              color: activeCategory === cat.key ? 'white' : 'var(--text-secondary)',
            }}>
              {isAr ? cat.labelAr : cat.label}
            </button>
          ))}
        </div>

        {/* Matrix */}
        <div className="hbtf-card">
          <div className="hbtf-card-header">
            <div>
              <span className="hbtf-card-label">
                {activeSectorDef?.icon} {isAr ? activeSectorDef?.labelAr : activeSectorDef?.label}
                {' → '}
                {isAr ? categories.find(c => c.key === activeCategory)?.labelAr : categories.find(c => c.key === activeCategory)?.label}
              </span>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {features.length} {isAr ? 'ميزة × 15 بنك' : 'features × 15 banks'} — {isAr ? 'مرّر على الخلية للتفاصيل' : 'hover any cell for product details'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span><span style={{ color: 'var(--positive)', fontWeight: 700 }}>✓</span> {isAr ? 'متاح' : 'Available'}</span>
              <span><span style={{ color: 'var(--positive)', fontWeight: 700 }}>●</span> {isAr ? 'إسلامي' : 'Islamic'}</span>
              <span><span style={{ color: 'var(--border)' }}>—</span> {isAr ? 'غير مدرج' : 'Not listed'}</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
          ) : features.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              {isAr ? 'لا توجد ميزات لهذه الفئة' : 'No features defined for this combination'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-table-head)' }}>
                    <th style={{ textAlign: 'start', padding: '0.75rem 1.25rem', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', minWidth: '210px', position: 'sticky', insetInlineStart: 0, background: 'var(--bg-table-head)', zIndex: 10 }}>
                      {isAr ? 'الميزة / المنتج' : 'Feature / Product'}
                    </th>
                    {banks.map(b => (
                      <th key={b.id} style={{ textAlign: 'center', padding: '0.5rem 0.375rem', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', minWidth: '68px', maxWidth: '84px' }}>
                        <a href={`/bank/${b.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{bName(b)}</div>
                          {b.bank_type === 'islamic' && <div style={{ fontSize: '0.5rem', color: 'var(--positive)', marginTop: '0.1rem' }}>●</div>}
                        </a>
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', fontSize: '0.6rem', fontWeight: 700, color: 'var(--accent)', borderBottom: '1px solid var(--border)', minWidth: '64px' }}>
                      {isAr ? 'التغطية' : 'Coverage'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, fi) => {
                    const matches = banks.map(b => ({ bank: b, product: getMatch(b.id, feature) }))
                    const count = matches.filter(m => m.product).length
                    const pct = Math.round((count / banks.length) * 100)

                    return (
                      <tr key={feature.key}
                        style={{ background: fi % 2 === 1 ? 'var(--bg-row-alt)' : '' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-row-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = fi % 2 === 1 ? 'var(--bg-row-alt)' : '')}>
                        <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.775rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', insetInlineStart: 0, background: fi % 2 === 1 ? 'var(--bg-row-alt)' : 'var(--bg-card)', zIndex: 5 }}>
                          {isAr ? feature.labelAr : feature.label}
                        </td>
                        {matches.map(({ bank, product }) => (
                          <td key={bank.id}
                            style={{ textAlign: 'center', padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle', cursor: product ? 'default' : 'default' }}
                            onMouseEnter={(e) => {
                              if (!product) return
                              const rect = e.currentTarget.getBoundingClientRect()
                              setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
                              setHoveredCell(`${feature.key}|||${bank.id}`)
                            }}
                            onMouseLeave={() => setHoveredCell(null)}>
                            {product
                              ? <span style={{ fontSize: '0.9375rem', color: 'var(--positive)' }}>{product.is_islamic ? '●' : '✓'}</span>
                              : <span style={{ color: 'var(--border)', fontSize: '0.75rem' }}>—</span>
                            }
                          </td>
                        ))}
                        <td style={{ textAlign: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: pct >= 80 ? 'var(--positive)' : pct >= 50 ? 'var(--accent)' : 'var(--text-muted)' }}>{count}/15</div>
                          <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', marginTop: '0.25rem', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'var(--positive)' : 'var(--accent)', borderRadius: '2px' }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg-table-head)' }}>
                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', borderTop: '2px solid var(--border)', position: 'sticky', insetInlineStart: 0, background: 'var(--bg-table-head)' }}>
                      {isAr ? 'إجمالي المنتجات في هذا القطاع والفئة' : 'Total products in this segment & category'}
                    </td>
                    {banks.map(b => {
                      const count = products.filter(p => p.bank_id === b.id && p.category === activeCategory && p.target_segment === activeSector).length
                      return (
                        <td key={b.id} style={{ textAlign: 'center', padding: '0.75rem 0.25rem', fontSize: '0.8rem', fontWeight: 800, color: count > 0 ? 'var(--accent)' : 'var(--border)', borderTop: '2px solid var(--border)' }}>
                          {count > 0 ? count : '—'}
                        </td>
                      )
                    })}
                    <td style={{ borderTop: '2px solid var(--border)' }} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {isAr ? '✓ = متاح · ● = إسلامي · — = غير مدرج · مرّر على الخانة لعرض تفاصيل المنتج · انقر على اسم البنك للصفحة الكاملة' : '✓ = available · ● = Islamic product · — = not listed in database · hover any cell for details · click bank name for full profile'}
        </p>
      </div>

      {/* Floating tooltip */}
      {hoveredProduct && (
        <div style={{
          position: 'fixed',
          left: Math.max(12, Math.min(tooltipPos.x - 110, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 232)),
          top: Math.max(8, tooltipPos.y - 12),
          transform: 'translateY(-100%)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '0.75rem 0.875rem',
          width: '220px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 9999, pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: '0.25rem' }}>
            {bName(hoveredProduct.bank)}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', lineHeight: 1.3 }}>
            {hoveredProduct.product.product_name_en}
          </div>
          {hoveredProduct.product.description_en && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {hoveredProduct.product.description_en.slice(0, 130)}{hoveredProduct.product.description_en.length > 130 ? '…' : ''}
            </div>
          )}
          {hoveredProduct.product.is_islamic && hoveredProduct.product.sharia_structure && (
            <div style={{ fontSize: '0.625rem', color: 'var(--positive)', marginTop: '0.375rem', fontWeight: 600 }}>
              ⬡ {hoveredProduct.product.sharia_structure}
            </div>
          )}
          {hoveredProduct.product.source_url && (
            <div style={{ marginTop: '0.375rem', fontSize: '0.65rem', color: 'var(--accent)' }}>
              ↗ {isAr ? 'المصدر متاح' : 'Source available'}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
