import { Helmet } from "react-helmet-async";
import { initializeApp } from "firebase/app";
import { getFirestore, getCountFromServer, collection, query, where, getDocs } from "firebase/firestore";
import { FIREBASE_API } from "../config";
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
// @mui
import { useTheme } from '@mui/material/styles';
import { Container, Typography, Stack, Grid } from "@mui/material";
// sections
import {
    AppWebsiteVisits,
    AppWidgetSummary,
} from '../sections/app';

export default function DashboardPage() {

    const app = initializeApp(FIREBASE_API);
    const db = getFirestore(app);
    const dataRef = useRef();

    const [customerCount, setCustomerCount] = useState(0)
    const [productCount, setProductCount] = useState(0)
    const [orderCount, setOrderCount] = useState(0)
    const [ordersByMonth, setOrdersByMonth] = useState([])

    const fetchCustomerCount = async () => {

        const customerCount = await getCountFromServer(collection(db, "customers"))
        setCustomerCount(customerCount.data().count)
    }

    const fetchProductCount = async () => {

        const productCount = await getCountFromServer(collection(db, "products"))
        setProductCount(productCount.data().count)
    }

    const fetchOrderCount = async () => {

        const orderCount = await getCountFromServer(collection(db, "orders"))
        setOrderCount(orderCount.data().count)
    }

    const fetchOrdersByMonth = async () => {

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);

        const q = query(collection(db, "orders"), where("date", ">=", startDate), where("date", "<=", endDate));

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            setOrdersByMonth(ordersByMonth => [...ordersByMonth, doc.data().date.toDate().getTime()])
        });
    }

    function getFormattedDaysInMonth(month, year) {
        var date = new Date(year, month, 1);
        var days = [];
        while (date.getMonth() === month) {
            days.push(format(new Date(date), 'MM/dd/yyyy'));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }

    function getDatesInMonth(month, year) {
        var date = new Date(year, month, 1);
        var days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date).getTime());
            date.setDate(date.getDate() + 1);
        }
        return days;
    }


    useEffect(() => {
        if (dataRef.current) return;
        dataRef.current = true;

        fetchCustomerCount();
        fetchProductCount();
        fetchOrderCount();
        fetchOrdersByMonth();
    }, [])

    const today = new Date();
    const formattedDaysInMonth = getFormattedDaysInMonth(today.getMonth(), today.getFullYear())

    const currentMonth = format(today, 'MMMM yyyy')
    const datesInMonth = getDatesInMonth(today.getMonth(), today.getFullYear())
    function getTotalOrders() {
        let ordersByMonthArray = new Array(formattedDaysInMonth.length).fill(0);
        for (let i = 0; i < datesInMonth.length; i++) {
            for (let j = 0; j < ordersByMonth.length; j++) {
                if (datesInMonth[i] === ordersByMonth[j]) {
                    ordersByMonthArray[i + 1] += 1
                }
            }
        }
        return ordersByMonthArray
    }

    const totalOrdersInMonth = getTotalOrders()

    return (
        <>
            <Helmet>
                <title>Dashboard</title>
            </Helmet>

            <Container>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                    <Typography variant="h4" gutterBottom>
                        Dashboard
                    </Typography>
                </Stack>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                        <AppWidgetSummary title="Total Customers" total={customerCount} icon={'ic:round-supervised-user-circle'} />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <AppWidgetSummary title="Total Products" total={productCount} color="info" icon={'mdi:candle'} />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <AppWidgetSummary title="Total Orders" total={orderCount} color="warning" icon={'material-symbols:order-approve'} />
                    </Grid>

                    <Grid item xs={12} md={12} lg={12}>
                        <AppWebsiteVisits
                            title="Monthly Sales"
                            subheader={`Total orders in ${currentMonth}`}
                            chartLabels={formattedDaysInMonth}
                            chartData={[
                                {
                                    name: 'Number of Orders',
                                    type: 'area',
                                    fill: 'gradient',
                                    data: totalOrdersInMonth,
                                }
                            ]}
                        />
                    </Grid>
                </Grid>
            </Container>
        </>
    )
}