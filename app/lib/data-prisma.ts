import { PrismaClient } from "@/generated/prisma";
import { formatCurrency } from './utils'; // Assurez-vous que cette fonction est importée

const prisma = new PrismaClient();

export async function fetchRevenue() {
  try {
    const data = await prisma.revenue.findMany();
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await prisma.invoices.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        customers: {
          select: {
            name: true,
            image_url: true,
            email: true,
          },
        },
      },
    });

    return data.map((invoice) => ({
      id: invoice.id,
      name: invoice.customers?.name || '',
      image_url: invoice.customers?.image_url || '',
      email: invoice.customers?.email || '',
      amount: formatCurrency(invoice.amount), // Utilisation de formatCurrency
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
      prisma.invoices.count(),
      prisma.customers.count(),
      prisma.invoices.groupBy({
        by: ['status'],
        _sum: { amount: true },
      }),
    ]);

    const totalPaidInvoices = invoiceStatus.find((s) => s.status === 'paid')?._sum.amount || 0;
    const totalPendingInvoices = invoiceStatus.find((s) => s.status === 'pending')?._sum.amount || 0;

    return {
      numberOfCustomers: customerCount,
      numberOfInvoices: invoiceCount,
      totalPaidInvoices: totalPaidInvoices / 100, // Convert cents to dollars
      totalPendingInvoices: totalPendingInvoices / 100, // Convert cents to dollars
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

export async function fetchFilteredInvoices(query: string, currentPage: number, itemsPerPage = 6) {
  const skip = (currentPage - 1) * itemsPerPage;

  try {
    const invoices = await prisma.invoices.findMany({
      skip,
      take: itemsPerPage,
      where: {
        OR: [
          { customers: { name: { contains: query, mode: 'insensitive' } } },
          { customers: { email: { contains: query, mode: 'insensitive' } } },
          { amount: { equals: parseInt(query) || undefined } },
          { date: { equals: new Date(query) || undefined } },
          { status: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { date: 'desc' },
      include: {
        customers: {
          select: {
            name: true,
            email: true,
            image_url: true,
          },
        },
      },
    });

    return invoices.map((invoice) => ({
      ...invoice,
      amount: invoice.amount / 100, // Convert cents to dollars
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string, itemsPerPage = 6) {
  try {
    const count = await prisma.invoices.count({
      where: {
        OR: [
          { customers: { name: { contains: query, mode: 'insensitive' } } },
          { customers: { email: { contains: query, mode: 'insensitive' } } },
          { amount: { equals: parseInt(query) || undefined } },
          { date: { equals: new Date(query) || undefined } },
          { status: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return Math.ceil(count / itemsPerPage);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const invoice = await prisma.invoices.findUnique({
      where: { id },
      include: {
        customers: {
          select: {
            name: true,
            email: true,
            image_url: true,
          },
        },
      },
    });

    if (!invoice) throw new Error('Invoice not found.');

    return {
      ...invoice,
      amount: invoice.amount / 100, // Convert cents to dollars
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await prisma.customers.findMany({
      orderBy: { name: 'asc' },
    });

    return customers;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const customers = await prisma.customers.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        invoices: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return customers.map((customer) => {
      const totalPending = customer.invoices
        .filter((invoice) => invoice.status === 'pending')
        .reduce((sum, invoice) => sum + invoice.amount, 0);

      const totalPaid = customer.invoices
        .filter((invoice) => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.amount, 0);

      return {
        ...customer,
        total_pending: totalPending / 100, // Convert cents to dollars
        total_paid: totalPaid / 100, // Convert cents to dollars
      };
    });
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer table.');
  }
}