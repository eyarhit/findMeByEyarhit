import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

interface Contact {
  id: number;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  image: string;
}
@Component({
  selector: 'app-liste-inter-contrat',
  templateUrl: './liste-inter-contrat.component.html',
  styleUrl: './liste-inter-contrat.component.scss'
})
export class ListeInterContratComponent implements OnInit {
  
  // Données statiques pour l'exemple
  contacts: Contact[] = [
    {
      id: 1,
      name: 'Martem',
      title: 'Développeur Frontend',
      company: 'DPC (Digital Power Consulting)',
      phone: '+216 94 587 245',
      email: 'Martem01@dpcpower.fr',
      image: 'assets/profile1.jpg'
    },
    {
      id: 2,
      name: 'Ivanhov',
      title: 'développeur Backend',
      company: 'DPC (Digital Power Consulting)',
      phone: '+216 94 587 245',
      email: 'Ivanhov123@dpcpower.fr',
      image: 'assets/profile2.jpg'
    },
    {
      id: 3,
      name: 'Ivanhov',
      title: 'Ingénieur DevOps',
      company: 'DPC (Digital Power Consulting)',
      phone: '+216 94 587 245',
      email: 'Ivanhov123@dpcpower.fr',
      image: 'assets/profile3.jpg'
    },
    {
      id: 4,
      name: 'Martem',
      title: 'Ingénieur IA',
      company: 'DPC (Digital Power Consulting)',
      phone: '+216 94 587 245',
      email: 'Martem01@dpcpower.fr',
      image: 'assets/profile1.jpg'
    },
    {
      id: 5,
      name: 'Ivanhov',
      title: 'Ingénieur Cloud',
      company: 'DPC (Digital Power Consulting)',
      phone: '+216 94 587 245',
      email: 'Ivanhov123@dpcpower.fr',
      image: 'assets/profile2.jpg'
    },
    {
      id: 6,
      name: 'Ivanhov',
      title: 'Ingénieur Sécurité',
      company: 'DPC (Digital Power Consulting)',
      phone: '+216 94 587 245',
      email: 'Ivanhov123@dpcpower.fr',
      image: 'assets/profile3.jpg'
    },
    {
      id: 7,
      name: 'Ivanhov',
      title: 'Développeur Fullstack',
      company: 'DPC (Digital Power Consulting)',
      phone: '+216 94 587 245',
      email: 'Ivanhov123@dpcpower.fr',
      image: 'assets/profile3.jpg'
    }
  ];

  // Variables pour la recherche
  searchTerm: string = '';
  filteredContacts: Contact[] = [];

  // Variables pour la pagination
  itemsPerPage: number = 6;
  currentPage: number = 1;
  totalPages: number = 1;

  // Variables pour le modal de suppression
  showDeleteModal: boolean = false;
  contactToDelete: Contact | null = null;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.filteredContacts = [...this.contacts];
    this.calculateTotalPages();
    this.applyFiltersAndPagination();
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.contacts.length / this.itemsPerPage);
  }

  applyFiltersAndPagination(): void {
    // Filtrer les contacts en fonction du terme de recherche
    const filtered = this.searchTerm.trim() 
      ? this.contacts.filter(contact => 
          contact.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          contact.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          contact.company.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      : [...this.contacts];
    
    // Mettre à jour le nombre total de pages
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    
    // Ajuster la page courante si nécessaire
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    // Appliquer la pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredContacts = filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.applyFiltersAndPagination();
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

openDeleteConfirmation(contact: Contact, event: Event): void {
  event.stopPropagation();
  Swal.fire({
    title: 'Supprimer ce contact ?',
    text: `Êtes-vous sûr de vouloir supprimer ${contact.name} ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) {
      this.contacts = this.contacts.filter(c => c.id !== contact.id);
      this.applyFiltersAndPagination();
      Swal.fire('Supprimé !', 'Le contact a été supprimé.', 'success');
    }
  });
}

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.contactToDelete = null;
  }

  confirmDelete(): void {
    if (this.contactToDelete) {
      // Supprimer le contact de la liste
      this.contacts = this.contacts.filter(c => c.id !== this.contactToDelete!.id);
      
      // Mettre à jour l'affichage
      this.applyFiltersAndPagination();
      
      // Fermer le modal
      this.closeDeleteModal();
    }
  }
}