public with sharing class StudentMentorController {

    @AuraEnabled(cacheable=true)
    public static List<mentor__c> getMentors() {
        return [
            SELECT Id, Name
            FROM mentor__c
            ORDER BY Name
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Student_Name__c> getStudents(Id mentorId) {
        return [
            SELECT Id, Name, mentor__c
            FROM Student_Name__c
            WHERE mentor__c = :mentorId
            ORDER BY Name
        ];
    }
}