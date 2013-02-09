@isTest private class FoobarTest
{
	private static testMethod void testDefault()
	{
		Foobar testFoobar;
		String actual;

		Test.startTest();

			testFoobar = new Foobar();
			actual = testFoobar.getValue();

        testFoobar.thisone();

		Test.stopTest();

		System.assertEquals( 'foobar', actual );
	}

	private static testMethod void testCustom()
	{
		Foobar testFoobar;
		String actual;

		Test.startTest();

			testFoobar = new Foobar('baz');
			actual = testFoobar.getValue();

		Test.stopTest();

		System.assertEquals( 'baz', actual );
	}

	private static testMethod void testSet()
	{
		Foobar testFoobar = new Foobar();
		String actual;

		Test.startTest();

			testFoobar.setValue('baz');
			actual = testFoobar.getValue();

		Test.stopTest();

		System.assertEquals( 'baz', actual );
	}
}
