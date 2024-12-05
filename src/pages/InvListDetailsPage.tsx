import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
} from '@ionic/react';
import {
  arrowBackCircle,
  basketOutline,
  closeCircle,
  addCircle,
  removeCircle,
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import './InvListDetailsPage.css';

const InvListDetailsPage: React.FC = () => {
  const { listId } = useParams<{ listId: string }>();
  const history = useHistory();

  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [listName, setListName] = useState('');

  useEffect(() => {
    async function fetchItems() {
      const user = getAuth().currentUser;
      if (!user) {
        alert('User not logged in!');
        return;
      }

      const listItemsRef = collection(db, `users/${user.uid}/lists/${listId}/items`);
      const querySnapshot = await getDocs(listItemsRef);

      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setInventoryList(items);
    }

    async function fetchAvailableItems() {
      const user = getAuth().currentUser;
      if (!user) return;

      const defaultItemsRef = collection(db, `users/${user.uid}/lists/default/items`);
      const querySnapshot = await getDocs(defaultItemsRef);

      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAvailableItems(items);
    }

    async function fetchListName() {
      const user = getAuth().currentUser;
      if (!user) return;

      const listRef = doc(db, `users/${user.uid}/lists/${listId}`);
      const listDoc = await getDoc(listRef);

      if (listDoc.exists()) {
        setListName(listDoc.data()?.name || listId);
      } else {
        console.error('List not found');
        setListName(listId); // Fallback to ID if name is not found
      }
    }

    fetchItems();
    fetchAvailableItems();
    fetchListName();
  }, [listId]);

  const addItemToInventoryList = async () => {
    if (!selectedItem) {
      alert('Please select an item.');
      return;
    }

    const user = getAuth().currentUser;
    if (!user) {
      alert('User not logged in!');
      return;
    }

    const selectedItemData = availableItems.find((item) => item.id === selectedItem);
    if (!selectedItemData) {
      alert('Item not found.');
      return;
    }

    const listItemsRef = collection(db, `users/${user.uid}/lists/${listId}/items`);
    const newItemRef = doc(listItemsRef);

    try {
      const newItem = {
        name: selectedItemData.name,
        category: selectedItemData.category,
        quantity: quantity,
        createdAt: new Date(),
      };
      await setDoc(newItemRef, newItem);

      setInventoryList((prevList) => [
        ...prevList,
        { id: newItemRef.id, ...newItem },
      ]);
      setSelectedItem('');
      setQuantity(1);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const user = getAuth().currentUser;
    if (!user) return;

    const itemRef = doc(db, `users/${user.uid}/lists/${listId}/items/${id}`);
    const currentItem = inventoryList.find((item) => item.id === id);

    if (!currentItem) return;

    const newQuantity = Math.max(0, currentItem.quantity + delta);

    try {
      await updateDoc(itemRef, { quantity: newQuantity });
      setInventoryList((prevList) =>
        prevList.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const deleteItem = async (id: string) => {
    const user = getAuth().currentUser;
    if (!user) return;

    const itemRef = doc(db, `users/${user.uid}/lists/${listId}/items/${id}`);

    try {
      await deleteDoc(itemRef);
      setInventoryList((prevList) => prevList.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color={'success'}>
          <IonButton
            onClick={() => history.goBack()}
            fill="clear"
            slot="start"
            style={{ width: 'auto', height: 'auto' }}
          >
            <IonIcon color="dark" size="large" icon={arrowBackCircle} />
          </IonButton>
          <IonTitle className="ion-text-center">SHOPVENTORY</IonTitle>
          <IonButton
            routerLink="/MainPage"
            fill="clear"
            slot="end"
            style={{ width: 'auto', height: 'auto' }}
          >
            <IonIcon icon={basketOutline} color="dark" size="large" />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonTitle className="page-title">
          <h1>{listName}</h1>
        </IonTitle>

        <IonItem>
          <IonSelect
            placeholder="Select Item"
            value={selectedItem}
            onIonChange={(e) => setSelectedItem(e.detail.value)}
          >
            {availableItems.map((item) => (
              <IonSelectOption key={item.id} value={item.id}>
                {item.name} ({item.category})
              </IonSelectOption>
            ))}
          </IonSelect>
          <IonInput
            type="number"
            placeholder="Quantity"
            value={quantity}
            onIonChange={(e) => setQuantity(parseInt(e.detail.value!, 10))}
          />
          <IonButton onClick={addItemToInventoryList} color="success">
            Add Item
          </IonButton>
          <IonButton routerLink="/NewItemPage" color="success">
            +
          </IonButton>
        </IonItem>

        <IonList>
          {inventoryList.map((item) => (
            <IonItem key={item.id}>
              <IonLabel>{item.name}</IonLabel>
              <div className="item-controls">
                <IonButton fill="clear" onClick={() => updateQuantity(item.id, -1)}>
                  <IonIcon icon={removeCircle} color="success" />
                </IonButton>
                <IonLabel>{item.quantity}</IonLabel>
                <IonButton fill="clear" onClick={() => updateQuantity(item.id, 1)}>
                  <IonIcon icon={addCircle} color="success" />
                </IonButton>
              </div>
              <IonIcon
                icon={closeCircle}
                color="dark"
                slot="end"
                onClick={() => deleteItem(item.id)}
              />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default InvListDetailsPage;
