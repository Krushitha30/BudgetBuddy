import csv
from django.db.models import Sum
from django.http import HttpResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from budgets.models import Budget
from expenses.models import Expense
from income.models import Income
from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from savings.models import SavingsGoal
from .utils import get_date_range


def get_monthly_financial_data(user, start_d, end_d, month, year):
    """Calculates monthly financial metrics for user in a date range."""
    total_income = float(
        Income.objects.filter(
            user=user,
            income_date__gte=start_d,
            income_date__lte=end_d
        ).aggregate(total=Sum('amount'))['total'] or 0.0
    )

    total_expense = float(
        Expense.objects.filter(
            user=user,
            expense_date__gte=start_d,
            expense_date__lte=end_d
        ).aggregate(total=Sum('amount'))['total'] or 0.0
    )

    current_balance = round(total_income - total_expense, 2)

    total_savings = float(
        SavingsGoal.objects.filter(user=user).aggregate(total=Sum('saved_amount'))['total'] or 0.0
    )

    # Budget remaining calculation
    user_budgets = Budget.objects.filter(user=user, month=month, year=year)
    remaining_budget = 0.0
    for budget in user_budgets:
        spent = float(
            Expense.objects.filter(
                user=user,
                category=budget.category,
                expense_date__month=month,
                expense_date__year=year
            ).aggregate(total=Sum('amount'))['total'] or 0.0
        )
        rem = float(budget.budget_amount) - spent
        if rem > 0:
            remaining_budget += rem

    return {
        "month": month,
        "year": year,
        "start_date": str(start_d),
        "end_date": str(end_d),
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "current_balance": current_balance,
        "total_savings": round(total_savings, 2),
        "remaining_budget": round(remaining_budget, 2)
    }


class MonthlyFinancialReportAPIView(APIView):
    """Task 2 & Task 6 - Monthly Financial Report API"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_d, end_d, month, year = get_date_range(request)
        data = get_monthly_financial_data(request.user, start_d, end_d, month, year)
        return Response(data, status=status.HTTP_200_OK)


class ExpenseReportAPIView(APIView):
    """Task 3, Task 6 & Task 7 - Expense Report API with CSV Export"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_d, end_d, month, year = get_date_range(request)
        expenses = Expense.objects.filter(
            user=request.user,
            expense_date__gte=start_d,
            expense_date__lte=end_d
        ).order_by('-expense_date', '-created_at')

        # Check if CSV export requested
        export_format = request.query_params.get('export', '').lower()
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="expense_report_{start_d}_to_{end_d}.csv"'

            writer = csv.writer(response)
            writer.writerow(['Expense Title', 'Category', 'Amount (₹)', 'Date', 'Description'])
            for exp in expenses:
                writer.writerow([exp.title, exp.category, exp.amount, exp.expense_date, exp.description])
            return response

        records = [
            {
                "title": exp.title,
                "category": exp.category,
                "amount": float(exp.amount),
                "date": str(exp.expense_date),
                "description": exp.description
            }
            for exp in expenses
        ]

        total_expense = sum(r['amount'] for r in records)

        return Response({
            "filter_period": {
                "start_date": str(start_d),
                "end_date": str(end_d)
            },
            "total_expense": round(total_expense, 2),
            "count": len(records),
            "expenses": records
        }, status=status.HTTP_200_OK)


class SavingsReportAPIView(APIView):
    """Task 4 & Task 7 - Savings Report API with CSV Export"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        goals = SavingsGoal.objects.filter(user=request.user).order_by('-created_at')

        export_format = request.query_params.get('export', '').lower()
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="savings_report.csv"'

            writer = csv.writer(response)
            writer.writerow(['Goal Name', 'Target Amount (₹)', 'Saved Amount (₹)', 'Remaining Amount (₹)', 'Progress (%)', 'Status', 'Target Date'])
            for g in goals:
                tgt = float(g.target_amount)
                svd = float(g.saved_amount)
                rem = max(0.0, tgt - svd)
                pct = round((svd / tgt * 100), 2) if tgt > 0 else 0.0
                writer.writerow([g.goal_name, tgt, svd, rem, f"{pct}%", g.status, str(g.target_date)])
            return response

        records = []
        total_target = 0.0
        total_saved = 0.0

        for g in goals:
            tgt = float(g.target_amount)
            svd = float(g.saved_amount)
            rem = max(0.0, tgt - svd)
            pct = round((svd / tgt * 100), 2) if tgt > 0 else 0.0

            total_target += tgt
            total_saved += svd

            records.append({
                "goal_name": g.goal_name,
                "target_amount": round(tgt, 2),
                "saved_amount": round(svd, 2),
                "remaining_amount": round(rem, 2),
                "progress_percentage": pct,
                "status": g.status,
                "target_date": str(g.target_date)
            })

        return Response({
            "total_goals": len(records),
            "total_target_amount": round(total_target, 2),
            "total_saved_amount": round(total_saved, 2),
            "savings_reports": records
        }, status=status.HTTP_200_OK)


class FullFinancialSummaryReportAPIView(APIView):
    """Task 5, Task 6 & Task 7 - Combined Financial Summary Report API"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_d, end_d, month, year = get_date_range(request)
        user = request.user

        # 1. Financial Summary
        financial_summary = get_monthly_financial_data(user, start_d, end_d, month, year)

        # 2. Expense Summary
        expenses = Expense.objects.filter(
            user=user, expense_date__gte=start_d, expense_date__lte=end_d
        ).order_by('-expense_date')
        expense_list = [
            {
                "title": exp.title,
                "category": exp.category,
                "amount": float(exp.amount),
                "date": str(exp.expense_date),
                "description": exp.description
            }
            for exp in expenses
        ]
        expense_by_category = {}
        for e in expense_list:
            expense_by_category[e['category']] = round(
                expense_by_category.get(e['category'], 0.0) + e['amount'], 2
            )

        # 3. Income Summary
        incomes = Income.objects.filter(
            user=user, income_date__gte=start_d, income_date__lte=end_d
        ).order_by('-income_date')
        income_list = [
            {
                "title": inc.title,
                "source": inc.source,
                "amount": float(inc.amount),
                "date": str(inc.income_date),
                "description": inc.description
            }
            for inc in incomes
        ]
        income_by_source = {}
        for i in income_list:
            income_by_source[i['source']] = round(
                income_by_source.get(i['source'], 0.0) + i['amount'], 2
            )

        # 4. Budget Summary
        user_budgets = Budget.objects.filter(user=user, month=month, year=year)
        budget_list = []
        for b in user_budgets:
            b_amt = float(b.budget_amount)
            b_spent = float(
                Expense.objects.filter(
                    user=user, category=b.category,
                    expense_date__month=month, expense_date__year=year
                ).aggregate(total=Sum('amount'))['total'] or 0.0
            )
            b_rem = b_amt - b_spent
            budget_list.append({
                "category": b.category,
                "budget_amount": round(b_amt, 2),
                "spent_amount": round(b_spent, 2),
                "remaining_amount": round(max(0.0, b_rem), 2),
                "overspent_amount": round(abs(min(0.0, b_rem)), 2)
            })

        # 5. Savings Summary
        goals = SavingsGoal.objects.filter(user=user)
        savings_list = [
            {
                "goal_name": g.goal_name,
                "target_amount": float(g.target_amount),
                "saved_amount": float(g.saved_amount),
                "remaining_amount": max(0.0, float(g.target_amount) - float(g.saved_amount)),
                "progress_percentage": round((float(g.saved_amount) / float(g.target_amount) * 100), 2) if float(g.target_amount) > 0 else 0.0,
                "status": g.status,
                "target_date": str(g.target_date)
            }
            for g in goals
        ]

        # 6. Latest Notifications
        notifications = NotificationSerializer(
            Notification.objects.filter(user=user).order_by('-created_at')[:5],
            many=True
        ).data

        # Check for CSV Export
        export_format = request.query_params.get('export', '').lower()
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="financial_summary_report_{month}_{year}.csv"'

            writer = csv.writer(response)
            writer.writerow(['--- FINANCIAL SUMMARY ---'])
            writer.writerow(['Month', 'Year', 'Total Income', 'Total Expense', 'Current Balance', 'Total Savings', 'Remaining Budget'])
            writer.writerow([month, year, financial_summary['total_income'], financial_summary['total_expense'], financial_summary['current_balance'], financial_summary['total_savings'], financial_summary['remaining_budget']])
            writer.writerow([])

            writer.writerow(['--- EXPENSE BREAKDOWN ---'])
            writer.writerow(['Title', 'Category', 'Amount', 'Date'])
            for exp in expense_list:
                writer.writerow([exp['title'], exp['category'], exp['amount'], exp['date']])
            writer.writerow([])

            writer.writerow(['--- SAVINGS GOALS ---'])
            writer.writerow(['Goal Name', 'Target Amount', 'Saved Amount', 'Progress (%)', 'Status'])
            for sg in savings_list:
                writer.writerow([sg['goal_name'], sg['target_amount'], sg['saved_amount'], f"{sg['progress_percentage']}%", sg['status']])

            return response

        return Response({
            "financial_summary": financial_summary,
            "expense_summary": {
                "total_expense": financial_summary['total_expense'],
                "category_breakdown": expense_by_category,
                "expenses": expense_list
            },
            "income_summary": {
                "total_income": financial_summary['total_income'],
                "source_breakdown": income_by_source,
                "incomes": income_list
            },
            "budget_summary": {
                "total_budgets": len(budget_list),
                "budgets": budget_list
            },
            "savings_summary": {
                "total_savings": financial_summary['total_savings'],
                "goals": savings_list
            },
            "latest_notifications": notifications
        }, status=status.HTTP_200_OK)


class ExportReportAPIView(APIView):
    """Task 7 - Dedicated Report Export API (CSV/JSON)"""
    permission_classes = [permissions.IsAuthenticated]
    format_kwarg = None  # Prevent DRF format negotiator from hijacking format=csv

    def get(self, request):
        try:
            report_type = request.query_params.get('type', 'summary').lower()
            export_format = request.query_params.get('export_format', 'csv').lower()

            start_d, end_d, month, year = get_date_range(request)
            user = request.user

            if export_format == 'csv':
                response = HttpResponse(content_type='text/csv')
                filename = f"budgetbuddy_{report_type}_report_{month}_{year}.csv"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                writer = csv.writer(response)

                if report_type == 'expenses':
                    expenses = Expense.objects.filter(user=user, expense_date__gte=start_d, expense_date__lte=end_d)
                    writer.writerow(['Expense Title', 'Category', 'Amount (₹)', 'Date', 'Description'])
                    for exp in expenses:
                        writer.writerow([exp.title, exp.category, exp.amount, exp.expense_date, exp.description])

                elif report_type == 'savings':
                    goals = SavingsGoal.objects.filter(user=user)
                    writer.writerow(['Goal Name', 'Target Amount', 'Saved Amount', 'Remaining', 'Progress (%)', 'Status'])
                    for g in goals:
                        tgt = float(g.target_amount)
                        svd = float(g.saved_amount)
                        rem = max(0.0, tgt - svd)
                        pct = round((svd / tgt * 100), 2) if tgt > 0 else 0.0
                        writer.writerow([g.goal_name, tgt, svd, rem, f"{pct}%", g.status])

                else:  # summary report
                    fin_data = get_monthly_financial_data(user, start_d, end_d, month, year)
                    writer.writerow(['Report', 'Value'])
                    writer.writerow(['Period', f"{month}/{year} ({start_d} to {end_d})"])
                    writer.writerow(['Total Income', fin_data['total_income']])
                    writer.writerow(['Total Expense', fin_data['total_expense']])
                    writer.writerow(['Current Balance', fin_data['current_balance']])
                    writer.writerow(['Total Savings', fin_data['total_savings']])
                    writer.writerow(['Remaining Budget', fin_data['remaining_budget']])

                return response

            # Return export-ready JSON structure
            fin_data = get_monthly_financial_data(user, start_d, end_d, month, year)
            return Response({
                "export_type": report_type,
                "export_format": export_format,
                "period": {"start_date": str(start_d), "end_date": str(end_d), "month": month, "year": year},
                "data": fin_data
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            raise exc
