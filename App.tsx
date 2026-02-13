import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, Wallet, TrendingDown, TrendingUp, Trash2, Calendar, Minus, PieChart, Download, Upload, X } from 'lucide-react';
import { CATEGORIES, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from './constants';
import { Transaction, TransactionType, ViewState } from './types';
import NumberPad from './components/NumberPad';
import Header from './components/Header';

const STORAGE_KEY = 'easybook_transactions';

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // New state for editing specific date history
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal States
  const [txToDelete, setTxToDelete] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Manual Add State
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [note, setNote] = useState('');

  // --- Effects ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load transactions", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  // --- Helpers ---
  const formatMoney = (num: number) => {
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); 
  };
  
  const formatMoneyFull = (num: number) => {
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isSameMonth = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  // Filter transactions for current month
  const monthlyTransactions = transactions.filter(t => isSameMonth(new Date(t.timestamp), currentDate));

  const getSummary = () => {
    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, total: income - expense };
  };

  const { income, expense, total } = getSummary();

  // Calendar Logic
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // Pre-calculate daily stats for the calendar
  const dailyStats: Record<number, { income: number, expense: number }> = {};
  monthlyTransactions.forEach(t => {
    const day = new Date(t.timestamp).getDate();
    if (!dailyStats[day]) dailyStats[day] = { income: 0, expense: 0 };
    if (t.type === 'income') dailyStats[day].income += t.amount;
    else dailyStats[day].expense += t.amount;
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // --- Long Press Logic ---
  const handleTouchStart = (day: number) => {
    longPressTimer.current = setTimeout(() => {
      const target = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setEditingDate(target);
      setView(ViewState.DAILY_DETAILS);
    }, 600); // 600ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // --- Actions ---
  const startAddTransaction = (type: TransactionType) => {
    setSelectedType(type);
    // Set default category based on type
    const defaultCat = type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0];
    setSelectedCategory(defaultCat);
    resetForm();
    setView(ViewState.ADD_MANUAL);
  };

  const handleAddTransaction = () => {
    const val = parseFloat(amountStr);
    if (val <= 0) return;

    // Use editingDate if available, otherwise use current time
    let timestamp = Date.now();
    let dateStr = new Date().toISOString();

    if (editingDate) {
      const now = new Date();
      const target = new Date(editingDate);
      target.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      timestamp = target.getTime();
      dateStr = target.toISOString();
    }

    const newTx: Transaction = {
      id: Date.now().toString(),
      amount: val,
      type: selectedType,
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      note: note,
      date: dateStr,
      timestamp: timestamp
    };

    setTransactions(prev => [newTx, ...prev]);
    resetForm();
    
    // If we were editing a specific date, go back to that date's view
    if (editingDate) {
      setView(ViewState.DAILY_DETAILS);
    } else {
      setView(ViewState.HOME);
      setCurrentDate(new Date()); // Jump to today
    }
  };

  const promptDelete = (id: string) => {
    setTxToDelete(id);
  };

  const executeDelete = () => {
    if (txToDelete) {
      setTransactions(prev => prev.filter(t => t.id !== txToDelete));
      setTxToDelete(null);
    }
  };

  const handleExport = () => {
    const headers = ['日期,类型,分类,金额,备注'];
    const rows = monthlyTransactions.map(t => {
      const date = new Date(t.timestamp).toLocaleDateString();
      const type = t.type === 'expense' ? '支出' : '收入';
      const safeNote = (t.note || '').replace(/,/g, ' ');
      return `${date},${type},${t.categoryName},${t.amount},${safeNote}`;
    });
    
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `乐龄记账_${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月.csv`;
    link.click();
  };

  const handleExportAll = () => {
    const headers = ['日期,类型,分类,金额,备注'];
    const allSorted = [...transactions].sort((a,b) => b.timestamp - a.timestamp);
    const rows = allSorted.map(t => {
      const date = new Date(t.timestamp).toLocaleDateString();
      const type = t.type === 'expense' ? '支出' : '收入';
      const safeNote = (t.note || '').replace(/,/g, ' ');
      return `${date},${type},${t.categoryName},${t.amount},${safeNote}`;
    });
    
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `乐龄记账_全部账单_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      let successCount = 0;
      let failCount = 0;
      const newTransactions: Transaction[] = [];

      // Determine start index (skip header if present)
      const startIndex = lines[0].includes('日期') || lines[0].includes('Date') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV split (doesn't handle quoted commas well, but sufficient for simple format)
        const parts = line.split(',');
        if (parts.length < 4) {
          failCount++;
          continue;
        }

        const [dateStr, typeStr, catName, amountStr, noteStr] = parts;

        // 1. Parse Date
        // Attempt to replace / with - for consistency
        const normalizedDateStr = dateStr.replace(/\//g, '-').trim();
        const date = new Date(normalizedDateStr);
        if (isNaN(date.getTime())) {
          failCount++;
          continue;
        }

        // 2. Parse Type
        let type: TransactionType | undefined;
        if (typeStr.includes('支出')) type = 'expense';
        else if (typeStr.includes('收入')) type = 'income';
        
        if (!type) {
           failCount++;
           continue;
        }

        // 3. Parse Amount
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) {
          failCount++;
          continue;
        }

        // 4. Map Category
        const cleanCatName = catName.trim();
        let category = CATEGORIES.find(c => c.name === cleanCatName);
        
        // If exact match fails, try fallback based on type
        if (!category) {
           category = type === 'income' 
             ? INCOME_CATEGORIES.find(c => c.id === 'cash') 
             : EXPENSE_CATEGORIES.find(c => c.id === 'other');
        }

        if (!category) {
            failCount++;
            continue;
        }

        newTransactions.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          amount: Math.abs(amount),
          type,
          categoryId: category.id,
          categoryName: category.name, // Use system name for consistency, or cleanCatName if you want to preserve user input
          note: (noteStr || '').trim(),
          date: date.toISOString(),
          timestamp: date.getTime()
        });
        successCount++;
      }

      if (successCount > 0) {
        setTransactions(prev => [...prev, ...newTransactions]);
        alert(`导入成功！\n成功: ${successCount} 条\n失败/跳过: ${failCount} 条`);
        setShowImportModal(false);
        // Refresh view potentially? React state update handles it.
      } else {
        alert(`导入失败。\n没有找到有效的账单记录。\n请检查文件格式。`);
      }
    };
    reader.readAsText(file);
  };

  const resetForm = () => {
    setAmountStr('0');
    setNote('');
  };

  // --- Numpad Logic ---
  const handleNumInput = (num: string) => {
    if (amountStr === '0' && num !== '.') {
      setAmountStr(num);
    } else {
      if (num === '.' && amountStr.includes('.')) return;
      if (amountStr.replace('.', '').length >= 8) return;
      setAmountStr(prev => prev + num);
    }
  };

  const handleDeleteNum = () => {
    if (amountStr.length === 1) {
      setAmountStr('0');
    } else {
      setAmountStr(prev => prev.slice(0, -1));
    }
  };

  // --- Views ---

  const renderDeleteModal = () => {
    if (!txToDelete) return null;
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 shadow-sm">
             <Trash2 size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">删除记录?</h3>
          <p className="text-slate-500 text-lg text-center mb-8 font-medium">删除后无法恢复，确定要删除吗？</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setTxToDelete(null)}
              className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xl active:bg-slate-200 active:scale-95 transition-all"
            >
              取消
            </button>
            <button 
              onClick={executeDelete}
              className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold text-xl active:bg-red-600 active:scale-95 shadow-lg shadow-red-200 transition-all"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderImportModal = () => {
    if (!showImportModal) return null;
    return (
       <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200 relative">
          <button 
            onClick={() => setShowImportModal(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 active:text-slate-600"
          >
            <X size={28} />
          </button>
          
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 shadow-sm">
             <Upload size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-4 text-center">导入账单 (CSV)</h3>
          
          <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600 leading-relaxed border border-slate-100">
             <p className="font-bold text-slate-800 mb-2 text-base">文件格式要求：</p>
             <ul className="list-disc pl-4 space-y-1">
               <li>必须是 <strong>.csv</strong> 格式文件</li>
               <li>列顺序: <span className="bg-white px-1 border rounded">日期, 类型, 分类, 金额, 备注</span></li>
               <li>日期格式: 2024-01-30 或 2024/01/30</li>
               <li>类型必须包含: &quot;支出&quot; 或 &quot;收入&quot;</li>
             </ul>
             <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="font-bold text-xs text-slate-500 mb-1">示例内容:</p>
                <code className="block bg-slate-800 text-green-400 p-2 rounded text-xs overflow-x-auto">
                   2024-05-20,支出,买菜,52.5,超市购物
                </code>
             </div>
          </div>

          <label className="block w-full">
            <span className="sr-only">选择文件</span>
            <input 
               type="file" 
               accept=".csv"
               onChange={handleImportFile}
               className="block w-full text-lg text-slate-500
                 file:mr-4 file:py-4 file:px-6
                 file:rounded-xl file:border-0
                 file:text-lg file:font-bold
                 file:bg-blue-50 file:text-blue-700
                 hover:file:bg-blue-100
                 active:file:scale-95 transition-all
               "
            />
          </label>
          
          <p className="text-center text-xs text-slate-400 mt-4">注意: 导入的数据将追加到现有账单中</p>
        </div>
      </div>
    );
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>);
    }

    // Day cells
    for (let i = 1; i <= daysInMonth; i++) {
      const stats = dailyStats[i];
      const isToday = isSameDay(new Date(), new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
      const hasIncome = stats?.income && stats.income > 0;
      const hasExpense = stats?.expense && stats.expense > 0;
      
      days.push(
        <div 
          key={i} 
          className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-between p-1.5 transition-all relative overflow-hidden active:scale-95 shadow-sm
            ${isToday ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200 z-10' : 'bg-white border-slate-100'}`}
          onTouchStart={() => handleTouchStart(i)}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleTouchStart(i)}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          <span className={`text-xl font-bold leading-none mt-1 ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>{i}</span>
          <div className="flex flex-col items-center w-full gap-0.5 mb-1">
            {hasIncome ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md w-full text-center leading-tight truncate shadow-sm">
                +{formatMoney(stats.income)}
              </span>
            ) : <div className="h-[1.1rem]"></div>}
            
            {hasExpense ? (
              <span className="text-xs font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-md w-full text-center leading-tight truncate shadow-sm">
                -{formatMoney(stats.expense)}
              </span>
            ) : <div className="h-[1.1rem]"></div>}
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 mb-8 select-none">
         {/* Weekday Header */}
         <div className="grid grid-cols-7 mb-3">
            {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
              <div key={d} className={`text-center font-bold text-lg ${i === 0 || i === 6 ? 'text-blue-500' : 'text-slate-400'}`}>{d}</div>
            ))}
         </div>
         {/* Calendar Grid */}
         <div className="grid grid-cols-7 gap-1.5">
            {days}
         </div>
         <div className="text-center mt-3 text-slate-400 text-sm font-medium">
            (长按日期补记账单)
         </div>
      </div>
    );
  };

  const renderReport = () => {
    // Group expenses by category
    const expenseStats = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Convert to array and sort desc
    const sortedExpenseCategories = Object.entries(expenseStats)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([name, amount]) => {
        const cat = CATEGORIES.find(c => c.name === name) || CATEGORIES[CATEGORIES.length - 1];
        const amt = amount as number;
        return {
          name,
          amount: amt,
          percent: expense > 0 ? (amt / expense) * 100 : 0,
          cat
        };
      });

    // Group income by category
    const incomeStats = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Convert to array and sort desc
    const sortedIncomeCategories = Object.entries(incomeStats)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([name, amount]) => {
        const cat = CATEGORIES.find(c => c.name === name) || CATEGORIES[CATEGORIES.length - 1];
        const amt = amount as number;
        return {
          name,
          amount: amt,
          percent: income > 0 ? (amt / income) * 100 : 0,
          cat
        };
      });

    return (
      <div className="flex flex-col h-full bg-slate-50">
        <Header 
          title="月度报表" 
          subtitle={`${currentDate.getMonth() + 1}月财务概览`}
          leftAction={
            <button onClick={() => setView(ViewState.HOME)} className="p-2 -ml-2 text-white active:scale-90 transition-transform">
              <ChevronLeft size={40} />
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto p-5 pb-20 no-scrollbar">
          {/* Overview Card */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 mb-8">
            <h3 className="text-slate-400 font-bold mb-6 text-lg tracking-wide uppercase">本月收支</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-income shadow-inner">
                       <TrendingUp size={24} strokeWidth={3} />
                    </div>
                    <span className="text-xl font-bold text-slate-700">总收入</span>
                 </div>
                 <span className="text-2xl font-bold text-income tracking-tight">+{formatMoneyFull(income)}</span>
              </div>
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-expense shadow-inner">
                       <TrendingDown size={24} strokeWidth={3} />
                    </div>
                    <span className="text-xl font-bold text-slate-700">总支出</span>
                 </div>
                 <span className="text-2xl font-bold text-expense tracking-tight">-{formatMoneyFull(expense)}</span>
              </div>
              <div className="border-t-2 border-slate-50 pt-4 flex justify-between items-center mt-2">
                 <span className="text-xl font-bold text-slate-400">结余</span>
                 <span className={`text-3xl font-black tracking-tight ${total >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {total >= 0 ? '+' : ''}{formatMoneyFull(total)}
                 </span>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="flex items-center gap-2 mb-4 px-1">
             <div className="w-1.5 h-8 bg-primary rounded-full"></div>
             <h3 className="text-2xl font-bold text-slate-800">支出排行</h3>
          </div>
          
          {sortedExpenseCategories.length === 0 ? (
             <div className="text-center py-8 opacity-50 border-2 border-dashed border-slate-200 rounded-2xl mb-6 bg-white">
               <PieChart size={64} className="mx-auto mb-3 text-slate-300" />
               <p className="text-xl text-slate-400 font-medium">本月暂无支出</p>
             </div>
          ) : (
            <div className="space-y-4 mb-8">
              {sortedExpenseCategories.map((item, index) => (
                <div key={item.name} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${item.cat.color}`}>
                          {item.cat.icon}
                       </div>
                       <div>
                         <span className="text-xl font-bold text-slate-800 block">{item.name}</span>
                         <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{item.percent.toFixed(0)}%</span>
                       </div>
                    </div>
                    <span className="text-xl font-bold text-slate-800">¥{formatMoney(item.amount)}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${item.percent}%`, opacity: Math.max(0.4, 1 - index * 0.1) }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Income Breakdown */}
           <div className="flex items-center gap-2 mb-4 px-1 mt-6">
             <div className="w-1.5 h-8 bg-income rounded-full"></div>
             <h3 className="text-2xl font-bold text-slate-800">收入排行</h3>
          </div>

          {sortedIncomeCategories.length === 0 ? (
             <div className="text-center py-8 opacity-50 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
               <p className="text-xl text-slate-400 font-medium">本月暂无收入</p>
             </div>
          ) : (
            <div className="space-y-4">
              {sortedIncomeCategories.map((item, index) => (
                <div key={item.name} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${item.cat.color}`}>
                          {item.cat.icon}
                       </div>
                       <div>
                         <span className="text-xl font-bold text-slate-800 block">{item.name}</span>
                         <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{item.percent.toFixed(0)}%</span>
                       </div>
                    </div>
                    <span className="text-xl font-bold text-slate-800">¥{formatMoney(item.amount)}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className="bg-income h-full rounded-full transition-all duration-500" 
                      style={{ width: `${item.percent}%`, opacity: Math.max(0.4, 1 - index * 0.1) }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-10 mb-6 space-y-4">
            <button 
              onClick={handleExport}
              className="w-full py-5 bg-white border-[3px] border-blue-500 text-blue-600 rounded-2xl font-bold text-xl flex items-center justify-center shadow-sm active:bg-blue-50 transition-all active:scale-[0.98]"
            >
              <Download size={28} className="mr-3" strokeWidth={2.5} /> 导出本月账单
            </button>
            
             <button 
              onClick={handleExportAll}
              className="w-full py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xl flex items-center justify-center shadow-sm active:bg-slate-200 transition-all active:scale-[0.98]"
            >
              <Download size={28} className="mr-3" strokeWidth={2.5} /> 导出全部账单
            </button>

            <div className="pt-4 border-t border-slate-200 mt-4">
              <button 
                onClick={() => setShowImportModal(true)}
                className="w-full py-5 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl font-bold text-xl flex items-center justify-center shadow-sm active:bg-blue-100 transition-all active:scale-[0.98]"
              >
                <Upload size={28} className="mr-3" strokeWidth={2.5} /> 导入账单
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <Header 
        title={`${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        rightAction={
          <button 
            onClick={() => setView(ViewState.REPORT)}
            className="p-2 -mr-2 text-white/90 active:text-white transition-colors active:scale-90"
            aria-label="查看报表"
          >
            <PieChart size={36} />
          </button>
        }
      />

      {/* Summary Card - Floating overlap */}
      <div className="px-4 -mt-12 relative z-20 mb-4">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 flex flex-col items-center border border-white/50">
          <p className="text-slate-500 text-lg font-medium mb-1">本月结余</p>
          <div className="text-4xl font-black text-slate-800 mb-6 tracking-tight">
            ¥{formatMoneyFull(total)}
          </div>
          
          <div className="w-full grid grid-cols-2 gap-6 border-t border-slate-100 pt-4">
            <div className="flex flex-col items-center border-r border-slate-100 pr-2">
              <div className="flex items-center text-expense font-bold mb-1 text-base bg-red-50 px-3 py-1 rounded-full">
                <TrendingDown className="mr-1.5" size={18} /> 支出
              </div>
              <span className="text-xl font-bold text-slate-700 mt-1">{formatMoneyFull(expense)}</span>
            </div>
            <div className="flex flex-col items-center pl-2">
              <div className="flex items-center text-income font-bold mb-1 text-base bg-green-50 px-3 py-1 rounded-full">
                <TrendingUp className="mr-1.5" size={18} /> 收入
              </div>
              <span className="text-xl font-bold text-slate-700 mt-1">{formatMoneyFull(income)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {renderCalendar()}

        {/* Transaction List */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4 px-1">
             <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
             <h3 className="text-2xl font-bold text-slate-800">月度明细</h3>
          </div>
          
          {monthlyTransactions.length === 0 ? (
            <div className="text-center py-12 opacity-60 bg-white rounded-3xl border-2 border-slate-100 border-dashed mx-1">
              <Calendar size={64} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
              <p className="text-xl text-slate-400 font-medium">本月暂无记录</p>
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {monthlyTransactions.sort((a,b) => b.timestamp - a.timestamp).map(t => {
                const cat = CATEGORIES.find(c => c.id === t.categoryId) || CATEGORIES[CATEGORIES.length - 1];
                return (
                  <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-transform touch-manipulation">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm ${cat?.color || 'bg-gray-100'}`}>
                        {cat?.icon || '?'}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-800">{t.categoryName}</h4>
                        <p className="text-slate-400 text-sm mt-1 font-medium">{new Date(t.timestamp).getDate()}日 {t.note ? `· ${t.note}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-2xl font-bold tracking-tight ${t.type === 'expense' ? 'text-slate-800' : 'text-income'}`}>
                        {t.type === 'expense' ? '-' : '+'}{formatMoneyFull(t.amount)}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); promptDelete(t.id); }} 
                        className="p-2 -mr-2 mt-1 text-slate-300 active:text-red-500 transition-colors"
                      >
                         <Trash2 size={22}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons Area */}
      <div className="absolute bottom-6 left-0 w-full px-6 flex justify-center gap-6 pointer-events-none z-30">
        <button 
          onClick={() => { setEditingDate(null); startAddTransaction('income'); }}
          className="pointer-events-auto flex-1 h-20 bg-emerald-500 rounded-3xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center text-white font-bold active:brightness-110 transition-all border-b-[6px] border-emerald-700 active:border-b-0 active:translate-y-[6px]"
        >
          <div className="flex items-center gap-2">
             <Plus size={28} strokeWidth={4} />
             <span className="text-2xl tracking-widest">收入</span>
          </div>
        </button>

        <button 
          onClick={() => { setEditingDate(null); startAddTransaction('expense'); }}
          className="pointer-events-auto flex-1 h-20 bg-red-500 rounded-3xl shadow-[0_10px_20px_rgba(239,68,68,0.3)] flex flex-col items-center justify-center text-white font-bold active:brightness-110 transition-all border-b-[6px] border-red-700 active:border-b-0 active:translate-y-[6px]"
        >
           <div className="flex items-center gap-2">
             <Minus size={28} strokeWidth={4} />
             <span className="text-2xl tracking-widest">支出</span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderDailyDetails = () => {
    if (!editingDate) return null;
    const dateStr = `${editingDate.getMonth() + 1}月${editingDate.getDate()}日`;
    
    // Filter transactions for this specific day
    const dayTransactions = transactions.filter(t => isSameDay(new Date(t.timestamp), editingDate));

    return (
      <div className="flex flex-col h-full bg-slate-50">
        {/* Header */}
        <div className="bg-white px-4 pt-12 pb-6 flex items-center justify-between border-b border-slate-100 shadow-sm z-10 sticky top-0">
          <button onClick={() => { setEditingDate(null); setView(ViewState.HOME); }} className="p-3 -ml-3 text-slate-600 active:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={40} />
          </button>
          <div className="text-3xl font-black text-slate-800 tracking-tight">
            {dateStr} 账单
          </div>
          <div className="w-10"></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {dayTransactions.length === 0 ? (
            <div className="text-center py-12 opacity-50">
               <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Wallet size={48} className="text-slate-300" strokeWidth={1.5} />
               </div>
               <p className="text-2xl text-slate-400 font-medium">当天没有记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayTransactions.sort((a,b) => b.timestamp - a.timestamp).map(t => {
                const cat = CATEGORIES.find(c => c.id === t.categoryId) || CATEGORIES[CATEGORIES.length - 1];
                return (
                  <div key={t.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm ${cat?.color || 'bg-gray-100'}`}>
                        {cat?.icon || '?'}
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-slate-800">{t.categoryName}</h4>
                        <p className="text-slate-400 text-base mt-1 font-medium">{new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {t.note ? `· ${t.note}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-2xl font-bold tracking-tight ${t.type === 'expense' ? 'text-slate-800' : 'text-income'}`}>
                        {t.type === 'expense' ? '-' : '+'}{formatMoneyFull(t.amount)}
                      </span>
                      <button onClick={() => promptDelete(t.id)} className="text-red-300 p-2 -mr-2 mt-2 active:text-red-500 active:scale-110 transition-all">
                         <Trash2 size={26}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons specific for this day */}
        <div className="p-6 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
           <div className="text-center text-slate-400 mb-4 text-base font-bold tracking-wider uppercase">补记 {dateStr}</div>
           <div className="flex gap-6">
             <button 
               onClick={() => startAddTransaction('income')}
               className="flex-1 h-16 bg-emerald-500 rounded-2xl text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
             >
               <Plus size={28} className="mr-2" strokeWidth={3} /> 补收入
             </button>
             <button 
               onClick={() => startAddTransaction('expense')}
               className="flex-1 h-16 bg-red-500 rounded-2xl text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-red-200 active:scale-95 transition-transform"
             >
               <Minus size={28} className="mr-2" strokeWidth={3} /> 补支出
             </button>
           </div>
        </div>
      </div>
    );
  };

  const renderAddManual = () => {
    // Determine categories based on selectedType
    const currentCategories = selectedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const themeColor = selectedType === 'income' ? 'text-emerald-600' : 'text-red-600';
    
    // Check if we are editing a past date
    const isPastDate = editingDate !== null;
    const titleDate = isPastDate 
      ? `${editingDate?.getMonth()! + 1}月${editingDate?.getDate()}日` 
      : '';

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Top Bar */}
        <div className="bg-slate-50 px-4 pt-12 pb-6 flex items-center justify-between border-b border-slate-100 shadow-sm z-20 sticky top-0">
          <button 
            onClick={() => {
              // Go back to details if editing date, else home
              if (editingDate) setView(ViewState.DAILY_DETAILS);
              else setView(ViewState.HOME);
            }} 
            className="p-3 -ml-3 text-slate-600 active:bg-slate-200 rounded-full transition-colors"
          >
            <ChevronLeft size={40} />
          </button>
          <div className="text-2xl font-bold text-slate-800">
            {isPastDate ? `补记 (${titleDate})` : (selectedType === 'income' ? '记收入' : '记支出')}
          </div>
          <div className="w-10"></div>
        </div>

        {/* Amount Display */}
        <div className="px-8 py-10 flex flex-col items-end justify-center bg-white border-b border-slate-100 relative overflow-hidden">
           {/* Background Decoration */}
           <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -mr-10 -mt-10 ${selectedType === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
           
          <div className="text-slate-400 text-xl font-bold mb-2 tracking-wide">金额</div>
          <div className={`text-7xl font-black tracking-tight ${themeColor} drop-shadow-sm`}>
            ¥{amountStr}
          </div>
        </div>

        {/* Category Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          <h3 className="text-slate-400 font-bold mb-4 px-1 text-lg tracking-wide uppercase">选择分类</h3>
          <div className="grid grid-cols-4 gap-4">
            {currentCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all aspect-square relative
                  ${selectedCategory.id === cat.id 
                    ? 'bg-white ring-[3px] ring-blue-500 shadow-lg transform -translate-y-1 z-10' 
                    : 'bg-white border-2 border-slate-200 shadow-sm active:bg-slate-100'}
                `}
              >
                <div className={`text-4xl mb-2 transition-transform ${selectedCategory.id === cat.id ? 'scale-110' : ''}`}>{cat.icon}</div>
                <span className={`text-sm font-bold truncate w-full text-center ${selectedCategory.id === cat.id ? 'text-blue-600' : 'text-slate-500'}`}>{cat.name}</span>
              </button>
            ))}
          </div>
          
          {/* Note Input */}
          <div className="mt-8 px-1 pb-6">
             <h3 className="text-slate-400 font-bold mb-3 text-lg tracking-wide uppercase">备注</h3>
             <input 
                type="text" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="点此输入备注..."
                className="w-full p-5 text-xl rounded-2xl border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white shadow-sm transition-all"
             />
          </div>
        </div>

        {/* Numpad */}
        <NumberPad 
          onNumber={handleNumInput} 
          onDelete={handleDeleteNum} 
          onConfirm={handleAddTransaction}
          onClear={() => setAmountStr('0')}
        />
      </div>
    );
  };

  return (
    <div className="h-full w-full max-w-lg mx-auto bg-white shadow-2xl overflow-hidden relative font-sans selection:bg-blue-100 selection:text-blue-900">
       {view === ViewState.HOME && renderHome()}
       {view === ViewState.DAILY_DETAILS && renderDailyDetails()}
       {view === ViewState.ADD_MANUAL && renderAddManual()}
       {view === ViewState.REPORT && renderReport()}
       
       {/* Modals */}
       {renderDeleteModal()}
       {renderImportModal()}
    </div>
  );
};

export default App;