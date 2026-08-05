import calendar
from datetime import date, datetime
from django.utils import timezone


def get_date_range(request):
    """
    Task 6 - Date Filter Logic
    Supports filter_type:
      - 'current_month' (default if no dates provided)
      - 'previous_month'
      - 'custom' (uses start_date & end_date)
      - explicit month & year query params
    Returns (start_date, end_date, month, year)
    """
    today = date.today()
    filter_type = request.query_params.get('filter_type', '').lower()
    start_date_str = request.query_params.get('start_date')
    end_date_str = request.query_params.get('end_date')
    month_param = request.query_params.get('month')
    year_param = request.query_params.get('year')

    selected_month = today.month
    selected_year = today.year

    if month_param and year_param:
        try:
            selected_month = int(month_param)
            selected_year = int(year_param)
            _, last_day = calendar.monthrange(selected_year, selected_month)
            start_d = date(selected_year, selected_month, 1)
            end_d = date(selected_year, selected_month, last_day)
            return start_d, end_d, selected_month, selected_year
        except ValueError:
            pass

    if filter_type == 'previous_month':
        if today.month == 1:
            selected_month = 12
            selected_year = today.year - 1
        else:
            selected_month = today.month - 1
            selected_year = today.year
        _, last_day = calendar.monthrange(selected_year, selected_month)
        start_d = date(selected_year, selected_month, 1)
        end_d = date(selected_year, selected_month, last_day)
        return start_d, end_d, selected_month, selected_year

    elif filter_type == 'custom' or (start_date_str and end_date_str):
        try:
            start_d = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_d = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            return start_d, end_d, start_d.month, start_d.year
        except (ValueError, TypeError):
            pass

    # Default to current_month
    _, last_day = calendar.monthrange(today.year, today.month)
    start_d = date(today.year, today.month, 1)
    end_d = date(today.year, today.month, last_day)
    return start_d, end_d, today.month, today.year
