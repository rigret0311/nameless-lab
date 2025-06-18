import sys
import zipfile
from io import BytesIO, StringIO
import pandas as pd

CATEGORY_MAP = {
    '食料品・飲料': 'プロテイン|米|水|コーヒー|サプリ|オートミール|紅茶|coke',
    '書籍・Kindle': 'Kindle|本|audible',
    '日用品': '洗剤|ティッシュ|シャンプー|コンタクト|ソープ',
    'ガジェット・PC関連': 'Anker|USB|ケーブル|モニター|マウス|キーボード|SSD|HDD',
    '衣服・ファッション': 'シャツ|パンツ|シューズ|時計',
    '趣味・娯楽': 'ゲーム|Switch|PS5|イヤホン',
    'ペット用品': '猫砂|キャットフード|ちゅ~る',
    '税金・ギフト券': '消費税|ギフト券',
}

COLUMN_MAPPING = {
    'date': ['Order Date', '注文日'],
    'item_name': ['Title', '商品名', 'Product Name'],
    'price': ['Purchase Price Per Unit', '価格', 'Unit Price']
}

def load_data(path: str) -> pd.DataFrame:
    """Load CSV data from a file path which may be a zip or CSV."""
    csv_data = None
    if path.lower().endswith('.zip'):
        with zipfile.ZipFile(path, 'r') as z:
            order_files = [f for f in z.namelist() if 'Retail.OrderHistory' in f and f.endswith('.csv')]
            if not order_files:
                raise FileNotFoundError('No Retail.OrderHistory CSV found in zip')
            csv_parts = []
            for i, fname in enumerate(order_files):
                content = z.read(fname).decode('utf-8', errors='ignore')
                if i == 0:
                    csv_parts.append(content)
                else:
                    csv_parts.append(content.split('\n', 1)[1])
            csv_data = ''.join(csv_parts)
    elif path.lower().endswith('.csv'):
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            csv_data = f.read()
    else:
        raise ValueError('Unsupported file type: ' + path)
    return pd.read_csv(StringIO(csv_data))

def map_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map various possible column names to unified ones."""
    found = {}
    for target, opts in COLUMN_MAPPING.items():
        for col in opts:
            if col in df.columns:
                found[target] = col
                break
    required = ['date', 'item_name', 'price']
    if not all(c in found for c in required):
        missing = set(required) - set(found.keys())
        raise ValueError(f'Missing required columns: {missing}. Available: {df.columns.tolist()}')
    return df[[found[c] for c in required]].rename(columns={v: k for k, v in found.items()})

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(subset=['price', 'date']).copy()
    df['date'] = pd.to_datetime(df['date'])
    df['price'] = df['price'].astype(str).str.replace(r'[^0-9.]', '', regex=True).astype(float)
    df['year_month'] = df['date'].dt.to_period('M')
    df = df[df['price'] > 0].copy()
    return df

def categorize(df: pd.DataFrame) -> pd.DataFrame:
    import re
    def assign(name: str):
        for category, keywords in CATEGORY_MAP.items():
            if re.search(keywords, str(name), re.IGNORECASE):
                return category
        return 'その他'
    df['category'] = df['item_name'].apply(assign)
    return df

def main(path: str):
    df = load_data(path)
    df = map_columns(df)
    df = clean_data(df)
    df = categorize(df)
    print(df.head())
    monthly = df.groupby('year_month')['price'].sum()
    print('\nMonthly spending summary:')
    print(monthly)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python amazon_order_analysis.py <order_history.zip|csv>')
        sys.exit(1)
    main(sys.argv[1])
