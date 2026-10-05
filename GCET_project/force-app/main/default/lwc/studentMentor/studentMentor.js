import { LightningElement, wire } from 'lwc';
import getMentors from '@salesforce/apex/StudentMentorController.getMentors';
import getStudents from '@salesforce/apex/StudentMentorController.getStudents';

export default class StudentMentor extends LightningElement {

    mentorOptions = [];
    selectedMentorId;
    selectedMentorName;
    students = [];

    // Get all mentors
    @wire(getMentors)
    wiredMentors({ data, error }) {
        if (data) {
            this.mentorOptions = data.map(mentor => ({
                label: mentor.Name,
                value: mentor.Id
            }));
        } else if (error) {
            console.error('Error loading mentors:', error);
        }
    }

    // Runs when user selects a mentor
    handleMentorChange(event) {
        this.selectedMentorId = event.detail.value;

        const selectedMentor = this.mentorOptions.find(
            mentor => mentor.value === this.selectedMentorId
        );

        this.selectedMentorName = selectedMentor
            ? selectedMentor.label
            : '';

        this.loadStudents();
    }

    // Get students belonging to selected mentor
    loadStudents() {
        getStudents({ mentorId: this.selectedMentorId })
            .then(result => {
                this.students = result;
            })
            .catch(error => {
                console.error('Error loading students:', error);
                this.students = [];
            });
    }

    // Number of students
    get studentCount() {
        return this.students.length;
    }

    // Show student information after mentor selection
    get showStudentDetails() {
        return !!this.selectedMentorId;
    }
}