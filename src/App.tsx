import CapitalPanel from './components/CapitalPanel';
import InputSection from './components/InputSection';
import EmaTable from './components/EmaTable';
import HistoryPanel from './components/HistoryPanel';

export default function App() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5">
      <div className="max-w-[1700px] mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-center text-2xl font-bold text-gray-800 mb-5">📊 EMA均线自动挂单价计算器</h1>

        <CapitalPanel />

        <div className="flex gap-5 items-start">
          <div className="flex-1 min-w-0">
            <InputSection />
            <EmaTable />

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-gray-600 text-sm leading-relaxed">
              <strong>💡 使用说明：</strong><br />
              1. 先填写「总资金」，再导入CSV或手动添加数据；<br />
              2. 表格中 <span className="bg-amber-100 px-1 rounded">黄色高亮</span> 列为 <strong>次日开盘前挂单价格</strong>；<br />
              3. 点击「加仓」输入整百股数买入；点击「减仓」可按百分比或股数卖出；<br />
              4. 「累计盈亏」= 已卖出收益 + 剩余持仓按当日收盘价估值，减去总投入及手续费。
            </div>
          </div>

          <HistoryPanel />
        </div>
      </div>
    </div>
  );
}
