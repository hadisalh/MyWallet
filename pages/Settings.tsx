import React, { useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES, ICON_MAP } from '../constants';
import { Moon, Sun, Bell, Database, Download, Upload, Tags, Plus, Trash2, Check } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

const Settings: React.FC = () => {
  const { settings, updateSettings, exportData, importData, categories, addCategory, deleteCategory } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  
  // New Category Form
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('AlertCircle');
  const [catColor, setCatColor] = useState('#64748b');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const success = await importData(file);
      if (success) {
        alert('تم استعادة النسخة الاحتياطية بنجاح!');
      } else {
        alert('فشل استيراد الملف.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
      e.preventDefault();
      addCategory({
          label: catName,
          iconName: catIcon,
          color: catColor,
          bg: 'bg-gray-100', // Simplified for custom cats
          text: 'text-gray-900',
      });
      setIsCatModalOpen(false);
      setCatName('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      
      {/* Category Management */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Tags size={20} className="text-pink-500" />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">إدارة التصنيفات</h3>
                      <p className="text-xs text-gray-500">تخصيص تصنيفات المصاريف والدخل</p>
                  </div>
              </div>
              <button 
                onClick={() => setIsCatModalOpen(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                  <Plus size={14} />
                  <span>جديد</span>
              </button>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
              {categories.map(cat => {
                  const Icon = ICON_MAP[cat.iconName] || ICON_MAP['AlertCircle'];
                  return (
                      <div key={cat.id} className="flex items-center justify-between p-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                          <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                                  <Icon size={14} />
                              </div>
                              <span className="text-xs font-bold truncate dark:text-gray-300">{cat.label}</span>
                          </div>
                          {cat.isCustom && (
                              <button onClick={() => deleteCategory(cat.id)} className="text-gray-400 hover:text-red-500">
                                  <Trash2 size={12} />
                              </button>
                          )}
                      </div>
                  )
              })}
          </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Appearance */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">المظهر والعرض</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {settings.darkMode ? <Moon size={20} className="text-purple-500" /> : <Sun size={20} className="text-orange-500" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">الوضع الليلي</p>
                  <p className="text-xs text-gray-500">تبديل بين المظهر الفاتح والداكن</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.darkMode}
                  onChange={(e) => updateSettings({ darkMode: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <span className="font-bold text-lg w-5 h-5 flex items-center justify-center text-green-600">$</span>
                 </div>
                 <div>
                    <p className="font-semibold text-gray-900 dark:text-white">العملة الرئيسية</p>
                    <p className="text-xs text-gray-500">اختر العملة المستخدمة في التطبيق</p>
                 </div>
               </div>
               <select 
                value={settings.currency}
                onChange={(e) => updateSettings({ currency: e.target.value })}
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
               >
                 {CURRENCIES.map(curr => <option key={curr} value={curr}>{curr}</option>)}
               </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">الإشعارات</h3>
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Bell size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">تفعيل التنبيهات</p>
                  <p className="text-xs text-gray-500">تنبيهات الديون وتجاوز الميزانية</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
        </div>

        {/* Backup & Data Management */}
        <div className="p-6">
           <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">إدارة البيانات</h3>
           <div className="flex flex-col gap-3">
               <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                       <Database size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">النسخ الاحتياطي</p>
                        <p className="text-xs text-gray-500">حفظ بياناتك أو نقلها لجهاز آخر</p>
                    </div>
               </div>
               
               <div className="flex gap-3">
                   <button 
                     onClick={exportData}
                     className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 py-3 rounded-xl transition-colors font-bold text-sm"
                   >
                       <Download size={16} />
                       <span>تصدير البيانات</span>
                   </button>
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 py-3 rounded-xl transition-colors font-bold text-sm"
                   >
                       <Upload size={16} />
                       <span>استيراد ملف</span>
                   </button>
                   <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".json" 
                        className="hidden" 
                   />
               </div>
           </div>
        </div>
      </div>

      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="إضافة تصنيف جديد">
          <form onSubmit={handleAddCategory} className="space-y-6">
              <div>
                  <label className="block text-sm font-bold mb-2 dark:text-white">اسم التصنيف</label>
                  <input required value={catName} onChange={e => setCatName(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="مثال: ألعاب فيديو" />
              </div>
              <div>
                  <label className="block text-sm font-bold mb-2 dark:text-white">الأيقونة</label>
                  <div className="grid grid-cols-6 gap-2">
                      {Object.keys(ICON_MAP).slice(0, 12).map(iconName => {
                          const Icon = ICON_MAP[iconName];
                          return (
                              <button key={iconName} type="button" onClick={() => setCatIcon(iconName)} className={`p-2 rounded-lg flex items-center justify-center border ${catIcon === iconName ? 'bg-primary-50 border-primary-500 text-primary-600' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
                                  <Icon size={20} />
                              </button>
                          )
                      })}
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold mb-2 dark:text-white">اللون</label>
                  <div className="flex gap-2">
                      {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
                          <button key={color} type="button" onClick={() => setCatColor(color)} style={{ backgroundColor: color }} className={`w-8 h-8 rounded-full ${catColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} />
                      ))}
                  </div>
              </div>
              <button type="submit" className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl">حفظ</button>
          </form>
      </Modal>

      <div className="text-center text-gray-400 text-xs">
        <p>الإصدار 2.0.0 (Pro)</p>
        <p className="mt-1">تم التطوير بواسطة React & Tailwind</p>
      </div>
    </div>
  );
};

export default Settings;