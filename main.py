from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Define a model for your data (if needed)
class Item(BaseModel):
    name: str
    description: str = None
    price: float
    tax: float = None

# A test route
@app.get("/")
def read_root():
    return {"Hello": "World"}

# A route to handle POST requests from React
@app.post("/items/")
def create_item(item: Item):
    return {"item_name": item.name, "item_price": item.price}

