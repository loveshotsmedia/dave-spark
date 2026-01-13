import { useState } from "react";
import { Calculator, DollarSign, TrendingUp, Users, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidePanel } from "./SlidePanel";
import { GaarWarningBadge } from "./GaarWarningBadge";
import {
  calculateEstateFreeze,
  calculateIFA,
  calculateTax,
  calculateEqualization,
  EstateFreezeResult,
  IFAResult,
  TaxCalculationResult,
  EstateEqualizationResult,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface CalculatorsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalculatorsPanel({ isOpen, onClose }: CalculatorsPanelProps) {
  return (
    <SlidePanel title="Financial Calculators" isOpen={isOpen} onClose={onClose}>
      <Tabs defaultValue="estate-freeze" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="estate-freeze" className="text-xs">Estate Freeze</TabsTrigger>
          <TabsTrigger value="ifa" className="text-xs">IFA</TabsTrigger>
          <TabsTrigger value="tax" className="text-xs">Tax</TabsTrigger>
          <TabsTrigger value="equalization" className="text-xs">Equalization</TabsTrigger>
        </TabsList>

        <TabsContent value="estate-freeze">
          <EstateFreezeCalculator />
        </TabsContent>

        <TabsContent value="ifa">
          <IFACalculator />
        </TabsContent>

        <TabsContent value="tax">
          <TaxCalculator />
        </TabsContent>

        <TabsContent value="equalization">
          <EqualizationCalculator />
        </TabsContent>
      </Tabs>
    </SlidePanel>
  );
}

function EstateFreezeCalculator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstateFreezeResult | null>(null);
  const [form, setForm] = useState({
    businessValue: "",
    acb: "",
    ownerAge: "",
    growthRate: "5",
    province: "manitoba",
  });

  const handleCalculate = async () => {
    if (!form.businessValue || !form.acb || !form.ownerAge) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await calculateEstateFreeze({
        businessValue: parseFloat(form.businessValue),
        acb: parseFloat(form.acb),
        ownerAge: parseFloat(form.ownerAge),
        growthRate: parseFloat(form.growthRate) / 100,
        province: form.province as "ontario" | "manitoba" | "alberta" | "bc",
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      toast({ title: "Calculation failed", description: "Unable to calculate estate freeze", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Estate Freeze Calculator
          </CardTitle>
          <CardDescription>Calculate tax implications of an estate freeze</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessValue">Business Value ($) *</Label>
              <Input
                id="businessValue"
                type="number"
                placeholder="5,000,000"
                value={form.businessValue}
                onChange={(e) => setForm({ ...form, businessValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acb">ACB ($) *</Label>
              <Input
                id="acb"
                type="number"
                placeholder="100"
                value={form.acb}
                onChange={(e) => setForm({ ...form, acb: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerAge">Owner Age *</Label>
              <Input
                id="ownerAge"
                type="number"
                placeholder="55"
                value={form.ownerAge}
                onChange={(e) => setForm({ ...form, ownerAge: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="growthRate">Growth Rate (%)</Label>
              <Input
                id="growthRate"
                type="number"
                placeholder="5"
                value={form.growthRate}
                onChange={(e) => setForm({ ...form, growthRate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Province</Label>
            <Select value={form.province} onValueChange={(v) => setForm({ ...form, province: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manitoba">Manitoba</SelectItem>
                <SelectItem value="ontario">Ontario</SelectItem>
                <SelectItem value="alberta">Alberta</SelectItem>
                <SelectItem value="bc">British Columbia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
            Calculate
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <ResultRow label="Current Value" value={formatCurrency(result.currentValue)} />
              <ResultRow label="ACB" value={formatCurrency(result.acb)} />
              <ResultRow label="Unrealized Gain" value={formatCurrency(result.unrealizedGain)} />
              <ResultRow label="Est. Tax on Death" value={formatCurrency(result.estimatedTaxOnDeath)} highlight />
              <ResultRow label="Preferred Share Value" value={formatCurrency(result.preferredShareValue)} />
              <ResultRow label="Growth Potential" value={result.commonShareGrowthPotential} />
              <ResultRow label="Tax Deferral Benefit" value={formatCurrency(result.taxDeferralBenefit)} highlight />
              <ResultRow label="LCGE Available" value={formatCurrency(result.lcgeAvailable)} />
              <ResultRow label="LCGE Applied" value={formatCurrency(result.lcgeApplied)} />
              <ResultRow label="Net Taxable Gain" value={formatCurrency(result.netTaxableGain)} />
            </div>
            {result.recommendation && (
              <div className="mt-4 p-3 rounded-lg bg-card border text-sm">
                <p className="font-medium mb-1">Recommendation:</p>
                <p className="text-muted-foreground">{result.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function IFACalculator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IFAResult | null>(null);
  const [form, setForm] = useState({
    annualDistribution: "",
    years: "20",
    interestRate: "6",
    initialLoan: "0",
  });

  const handleCalculate = async () => {
    if (!form.annualDistribution || !form.years) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await calculateIFA({
        annualDistribution: parseFloat(form.annualDistribution),
        years: parseInt(form.years),
        interestRate: parseFloat(form.interestRate) / 100,
        initialLoan: parseFloat(form.initialLoan) || 0,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      toast({ title: "Calculation failed", description: "Unable to calculate IFA", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            IFA Projection Calculator
          </CardTitle>
          <CardDescription>Insured Financing Arrangement projections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualDist">Annual Distribution ($) *</Label>
              <Input
                id="annualDist"
                type="number"
                placeholder="100,000"
                value={form.annualDistribution}
                onChange={(e) => setForm({ ...form, annualDistribution: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="years">Years *</Label>
              <Input
                id="years"
                type="number"
                placeholder="20"
                value={form.years}
                onChange={(e) => setForm({ ...form, years: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                placeholder="6"
                value={form.interestRate}
                onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialLoan">Initial Loan ($)</Label>
              <Input
                id="initialLoan"
                type="number"
                placeholder="0"
                value={form.initialLoan}
                onChange={(e) => setForm({ ...form, initialLoan: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
            Calculate
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">IFA Projection Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <ResultRow label="Annual Distribution" value={formatCurrency(result.annualDistribution)} />
              <ResultRow label="Interest Rate" value={`${(result.interestRate * 100).toFixed(1)}%`} />
              <ResultRow label="Years" value={result.years.toString()} />
              <ResultRow label="Initial Loan" value={formatCurrency(result.initialLoanAmount)} />
              <ResultRow label="Projected Loan Balance" value={formatCurrency(result.projectedLoanBalance)} highlight />
              <ResultRow label="Total Interest Paid" value={formatCurrency(result.totalInterestPaid)} />
              <ResultRow label="Required Death Benefit" value={formatCurrency(result.requiredDeathBenefit)} highlight />
              <ResultRow label="Net to Estate" value={formatCurrency(result.netToEstate)} />
            </div>

            {result.yearByYear && result.yearByYear.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-sm mb-2">Year-by-Year Projection</p>
                <div className="max-h-48 overflow-y-auto rounded border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left">Year</th>
                        <th className="px-2 py-1 text-right">Distribution</th>
                        <th className="px-2 py-1 text-right">Interest</th>
                        <th className="px-2 py-1 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearByYear.map((row) => (
                        <tr key={row.year} className="border-t">
                          <td className="px-2 py-1">{row.year}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(row.distribution)}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(row.interest)}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(row.loanBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TaxCalculator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TaxCalculationResult | null>(null);
  const [form, setForm] = useState({
    income: "",
    province: "manitoba",
  });

  const handleCalculate = async () => {
    if (!form.income) {
      toast({ title: "Missing income", description: "Please enter an income amount", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await calculateTax({
        income: parseFloat(form.income),
        province: form.province as "ontario" | "manitoba" | "alberta" | "bc",
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      toast({ title: "Calculation failed", description: "Unable to calculate tax", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(val);
  const formatPercent = (val: number) => `${(val * 100).toFixed(2)}%`;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Marginal Tax Rate Calculator
          </CardTitle>
          <CardDescription>Calculate federal and provincial tax rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income">Income ($) *</Label>
            <Input
              id="income"
              type="number"
              placeholder="150,000"
              value={form.income}
              onChange={(e) => setForm({ ...form, income: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Province</Label>
            <Select value={form.province} onValueChange={(v) => setForm({ ...form, province: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manitoba">Manitoba</SelectItem>
                <SelectItem value="ontario">Ontario</SelectItem>
                <SelectItem value="alberta">Alberta</SelectItem>
                <SelectItem value="bc">British Columbia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
            Calculate
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tax Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <ResultRow label="Federal Rate" value={formatPercent(result.federalRate)} />
              <ResultRow label="Provincial Rate" value={formatPercent(result.provincialRate)} />
              <ResultRow label="Combined Rate" value={formatPercent(result.combinedRate)} highlight />
              <ResultRow label="Tax on Income" value={formatCurrency(result.taxOnIncome)} highlight />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EqualizationCalculator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstateEqualizationResult | null>(null);
  const [form, setForm] = useState({
    businessValue: "",
    totalChildren: "",
    childrenInBusiness: "",
    otherAssets: "0",
    ifaLoanBalance: "0",
  });

  const handleCalculate = async () => {
    if (!form.businessValue || !form.totalChildren || !form.childrenInBusiness) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await calculateEqualization({
        businessValue: parseFloat(form.businessValue),
        totalChildren: parseInt(form.totalChildren),
        childrenInBusiness: parseInt(form.childrenInBusiness),
        otherAssets: parseFloat(form.otherAssets) || 0,
        ifaLoanBalance: parseFloat(form.ifaLoanBalance) || 0,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      toast({ title: "Calculation failed", description: "Unable to calculate equalization", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Estate Equalization Calculator
          </CardTitle>
          <CardDescription>Calculate insurance needed for fair inheritance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bizValue">Business Value ($) *</Label>
              <Input
                id="bizValue"
                type="number"
                placeholder="5,000,000"
                value={form.businessValue}
                onChange={(e) => setForm({ ...form, businessValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalKids">Total Children *</Label>
              <Input
                id="totalKids"
                type="number"
                placeholder="3"
                value={form.totalChildren}
                onChange={(e) => setForm({ ...form, totalChildren: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bizKids">Children in Business *</Label>
              <Input
                id="bizKids"
                type="number"
                placeholder="1"
                value={form.childrenInBusiness}
                onChange={(e) => setForm({ ...form, childrenInBusiness: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherAssets">Other Assets ($)</Label>
              <Input
                id="otherAssets"
                type="number"
                placeholder="500,000"
                value={form.otherAssets}
                onChange={(e) => setForm({ ...form, otherAssets: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ifaLoan">IFA Loan Balance ($)</Label>
            <Input
              id="ifaLoan"
              type="number"
              placeholder="0"
              value={form.ifaLoanBalance}
              onChange={(e) => setForm({ ...form, ifaLoanBalance: e.target.value })}
            />
          </div>
          <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
            Calculate
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Equalization Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <ResultRow label="Business Value" value={formatCurrency(result.businessValue)} />
              <ResultRow label="Total Estate Value" value={formatCurrency(result.totalEstateValue)} />
              <ResultRow label="Total Children" value={result.totalChildren.toString()} />
              <ResultRow label="In Business" value={result.childrenInBusiness.toString()} />
              <ResultRow label="Outside Business" value={result.childrenOutsideBusiness.toString()} />
              <ResultRow label="Equal Share Per Child" value={formatCurrency(result.equalSharePerChild)} />
              <ResultRow label="Business Children Receive" value={formatCurrency(result.businessChildrenReceive)} />
              <ResultRow label="Non-Business Children Need" value={formatCurrency(result.nonBusinessChildrenNeed)} />
              <ResultRow label="Insurance Required" value={formatCurrency(result.insuranceRequired)} highlight />
            </div>
            {result.recommendation && (
              <div className="mt-4 p-3 rounded-lg bg-card border text-sm">
                <p className="font-medium mb-1">Recommendation:</p>
                <p className="text-muted-foreground">{result.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-primary" : "font-medium"}>{value}</span>
    </div>
  );
}
